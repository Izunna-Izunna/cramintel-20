
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TextractResponse {
  text: string;
  confidence: number;
  method: 'textract-sync' | 'textract-async';
  metadata?: any;
}

// AWS Signature V4 implementation using Deno's native crypto
class AWSSignatureV4 {
  private accessKeyId: string;
  private secretAccessKey: string;
  private region: string;
  private service: string;

  constructor(accessKeyId: string, secretAccessKey: string, region: string, service: string) {
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
    this.region = region;
    this.service = service;
  }

  private async hash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async hmac(key: Uint8Array, data: string): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
    return new Uint8Array(signature);
  }

  private async getSignatureKey(dateStamp: string): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const kDate = await this.hmac(encoder.encode(`AWS4${this.secretAccessKey}`), dateStamp);
    const kRegion = await this.hmac(kDate, this.region);
    const kService = await this.hmac(kRegion, this.service);
    const kSigning = await this.hmac(kService, 'aws4_request');
    return kSigning;
  }

  async signRequest(method: string, host: string, path: string, payload: string, headers: Record<string, string>): Promise<Record<string, string>> {
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substr(0, 8);

    // Canonical request
    const payloadHash = await this.hash(payload);
    const canonicalHeaders = Object.keys(headers)
      .sort()
      .map(key => `${key.toLowerCase()}:${headers[key]}\n`)
      .join('');
    const signedHeaders = Object.keys(headers)
      .sort()
      .map(key => key.toLowerCase())
      .join(';');

    const canonicalRequest = [
      method,
      path,
      '', // query string
      canonicalHeaders,
      signedHeaders,
      payloadHash
    ].join('\n');

    // String to sign
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${this.region}/${this.service}/aws4_request`;
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      await this.hash(canonicalRequest)
    ].join('\n');

    // Calculate signature
    const signingKey = await this.getSignatureKey(dateStamp);
    const signature = await this.hmac(signingKey, stringToSign);
    const signatureHex = Array.from(signature)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Authorization header
    const authorization = `${algorithm} Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signatureHex}`;

    return {
      ...headers,
      'X-Amz-Date': amzDate,
      'Authorization': authorization
    };
  }
}

// Helper function to convert Uint8Array to base64 string
function uint8ArrayToBase64(uint8Array: Uint8Array): string {
  let binary = '';
  const len = uint8Array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath, materialId, fileType } = await req.json();

    if (!filePath || !materialId) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting manual Textract extraction for material:', materialId);

    // Get AWS credentials
    const awsAccessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
    const awsSecretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');
    const awsRegion = Deno.env.get('AWS_REGION') || 'us-east-1';

    if (!awsAccessKeyId || !awsSecretAccessKey) {
      throw new Error('AWS credentials not configured');
    }

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('cramintel-materials')
      .download(filePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    const fileBuffer = await fileData.arrayBuffer();
    const fileSize = fileBuffer.byteLength;
    
    console.log('File downloaded, size:', fileSize, 'bytes');

    // Determine if we should use sync or async processing
    const useAsyncProcessing = fileSize > 5 * 1024 * 1024; // 5MB threshold

    let extractionResult: TextractResponse;

    if (useAsyncProcessing) {
      console.log('Using async Textract processing for large file');
      extractionResult = await processTextractAsync(fileBuffer, awsAccessKeyId, awsSecretAccessKey, awsRegion);
    } else {
      console.log('Using sync Textract processing');
      extractionResult = await processTextractSync(fileBuffer, awsAccessKeyId, awsSecretAccessKey, awsRegion);
    }

    // Update material with extraction results
    await supabase
      .from('cramintel_materials')
      .update({
        extraction_method: extractionResult.method,
        extraction_confidence: extractionResult.confidence,
        extraction_metadata: extractionResult.metadata || {}
      })
      .eq('id', materialId);

    return new Response(JSON.stringify({
      success: true,
      extractedText: extractionResult.text,
      confidence: extractionResult.confidence,
      method: extractionResult.method,
      fileSize
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in textract-service:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processTextractSync(
  fileBuffer: ArrayBuffer, 
  accessKeyId: string, 
  secretAccessKey: string, 
  region: string
): Promise<TextractResponse> {
  const uint8Array = new Uint8Array(fileBuffer);
  
  try {
    console.log('Calling Textract using manual AWS API implementation with Deno native fetch and crypto');
    
    // Convert bytes to base64 string for AWS API
    const base64Bytes = uint8ArrayToBase64(uint8Array);
    console.log('Converted file to base64, length:', base64Bytes.length);
    
    // Create AWS API request payload
    const payload = {
      Document: {
        Bytes: base64Bytes
      }
    };

    const body = JSON.stringify(payload);
    const host = `textract.${region}.amazonaws.com`;
    const path = '/';
    const method = 'POST';

    // Prepare headers
    const headers = {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'Textract.DetectDocumentText',
      'Host': host,
      'Content-Length': body.length.toString()
    };

    // Sign the request using our manual AWS Signature V4 implementation
    const signer = new AWSSignatureV4(accessKeyId, secretAccessKey, region, 'textract');
    const signedHeaders = await signer.signRequest(method, host, path, body, headers);

    // Make the API call using Deno's native fetch
    const response = await fetch(`https://${host}${path}`, {
      method: method,
      headers: signedHeaders,
      body: body
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Textract API error:', response.status, errorText);
      throw new Error(`Textract API returned ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();
    
    // Extract text and calculate average confidence
    let extractedText = '';
    let totalConfidence = 0;
    let blockCount = 0;

    if (responseData.Blocks) {
      for (const block of responseData.Blocks) {
        if (block.BlockType === 'LINE' && block.Text) {
          extractedText += block.Text + '\n';
          if (block.Confidence) {
            totalConfidence += block.Confidence;
            blockCount++;
          }
        }
      }
    }

    const averageConfidence = blockCount > 0 ? totalConfidence / blockCount : 0;

    console.log(`Manual Textract extraction successful: ${extractedText.length} characters extracted with ${averageConfidence.toFixed(1)}% confidence`);

    return {
      text: extractedText.trim(),
      confidence: averageConfidence,
      method: 'textract-sync',
      metadata: {
        totalBlocks: responseData.Blocks?.length || 0,
        textBlocks: blockCount,
        implementation: 'manual-aws-api-deno-native',
        apiVersion: 'textract-detect-document-text-v1'
      }
    };
  } catch (error) {
    console.error('Manual Textract processing error:', error);
    throw new Error(`Manual Textract processing failed: ${error.message}`);
  }
}

async function processTextractAsync(
  fileBuffer: ArrayBuffer, 
  accessKeyId: string, 
  secretAccessKey: string, 
  region: string
): Promise<TextractResponse> {
  // For now, implement a simplified version that falls back to sync
  // In a full implementation, this would use StartDocumentTextDetection and polling
  console.log('Async processing requested, falling back to sync for now');
  return await processTextractSync(fileBuffer, accessKeyId, secretAccessKey, region);
}
