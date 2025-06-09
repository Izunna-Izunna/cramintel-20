
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
  method: 'textract-sync' | 'textract-async' | 'fallback';
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

// Helper function to detect PDF files
function isPdfFile(fileType: string): boolean {
  return fileType === 'application/pdf';
}

// Helper function to detect image files
function isImageFile(fileType: string): boolean {
  const imageMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff'
  ];
  return imageMimeTypes.includes(fileType?.toLowerCase());
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

    console.log('Starting Textract extraction for material:', materialId, 'File type:', fileType);

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

    let extractionResult: TextractResponse;

    // Route based on file type
    if (isPdfFile(fileType)) {
      console.log('Processing PDF with async Textract API');
      extractionResult = await processTextractAsync(fileBuffer, filePath, awsAccessKeyId, awsSecretAccessKey, awsRegion, supabase);
    } else if (isImageFile(fileType)) {
      console.log('Processing image with sync Textract API');
      extractionResult = await processTextractSync(fileBuffer, awsAccessKeyId, awsSecretAccessKey, awsRegion);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
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
    console.log('Using sync Textract DetectDocumentText for image');
    
    const base64Bytes = uint8ArrayToBase64(uint8Array);
    console.log('Converted image to base64, length:', base64Bytes.length);
    
    const payload = {
      Document: {
        Bytes: base64Bytes
      }
    };

    const body = JSON.stringify(payload);
    const host = `textract.${region}.amazonaws.com`;
    const path = '/';
    const method = 'POST';

    const headers = {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'Textract.DetectDocumentText',
      'Host': host,
      'Content-Length': body.length.toString()
    };

    const signer = new AWSSignatureV4(accessKeyId, secretAccessKey, region, 'textract');
    const signedHeaders = await signer.signRequest(method, host, path, body, headers);

    const response = await fetch(`https://${host}${path}`, {
      method: method,
      headers: signedHeaders,
      body: body
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Textract sync API error:', response.status, errorText);
      throw new Error(`Textract API returned ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();
    
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

    console.log(`Sync Textract extraction successful: ${extractedText.length} characters with ${averageConfidence.toFixed(1)}% confidence`);

    return {
      text: extractedText.trim(),
      confidence: averageConfidence,
      method: 'textract-sync',
      metadata: {
        totalBlocks: responseData.Blocks?.length || 0,
        textBlocks: blockCount,
        implementation: 'sync-api'
      }
    };
  } catch (error) {
    console.error('Sync Textract processing error:', error);
    throw new Error(`Sync Textract processing failed: ${error.message}`);
  }
}

async function processTextractAsync(
  fileBuffer: ArrayBuffer,
  filePath: string,
  accessKeyId: string, 
  secretAccessKey: string, 
  region: string,
  supabase: any
): Promise<TextractResponse> {
  try {
    console.log('Starting async Textract processing for PDF');
    
    // Create a temporary public URL for the file that AWS can access
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('cramintel-materials')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (urlError || !signedUrl) {
      throw new Error(`Failed to create signed URL: ${urlError?.message}`);
    }

    console.log('Created signed URL for Textract async processing');

    // For now, we'll use the document upload approach since we need S3 bucket
    // This is a simplified implementation that uploads the document directly
    return await processTextractAsyncWithDocumentUpload(fileBuffer, accessKeyId, secretAccessKey, region);

  } catch (error) {
    console.error('Async Textract processing error:', error);
    
    // Fallback to sync processing for small PDFs (this will likely fail, but we'll try)
    console.log('Attempting fallback to sync processing');
    try {
      return await processTextractSync(fileBuffer, accessKeyId, secretAccessKey, region);
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      throw new Error(`Async Textract processing failed: ${error.message}. Fallback also failed: ${fallbackError.message}`);
    }
  }
}

async function processTextractAsyncWithDocumentUpload(
  fileBuffer: ArrayBuffer,
  accessKeyId: string,
  secretAccessKey: string,
  region: string
): Promise<TextractResponse> {
  const uint8Array = new Uint8Array(fileBuffer);
  
  try {
    console.log('Using async Textract StartDocumentTextDetection for PDF');
    
    const base64Bytes = uint8ArrayToBase64(uint8Array);
    console.log('Converted PDF to base64, length:', base64Bytes.length);
    
    // Step 1: Start the document text detection job
    const startPayload = {
      Document: {
        Bytes: base64Bytes
      }
    };

    const startBody = JSON.stringify(startPayload);
    const host = `textract.${region}.amazonaws.com`;
    const path = '/';
    const method = 'POST';

    const startHeaders = {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'Textract.StartDocumentTextDetection',
      'Host': host,
      'Content-Length': startBody.length.toString()
    };

    const signer = new AWSSignatureV4(accessKeyId, secretAccessKey, region, 'textract');
    const signedStartHeaders = await signer.signRequest(method, host, path, startBody, startHeaders);

    console.log('Starting async Textract job...');
    const startResponse = await fetch(`https://${host}${path}`, {
      method: method,
      headers: signedStartHeaders,
      body: startBody
    });

    if (!startResponse.ok) {
      const errorText = await startResponse.text();
      console.error('Textract start job error:', startResponse.status, errorText);
      throw new Error(`Textract start job failed: ${startResponse.status}: ${errorText}`);
    }

    const startData = await startResponse.json();
    const jobId = startData.JobId;
    
    if (!jobId) {
      throw new Error('No JobId returned from StartDocumentTextDetection');
    }

    console.log('Async job started with ID:', jobId);

    // Step 2: Poll for job completion
    let jobStatus = 'IN_PROGRESS';
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max
    let allBlocks: any[] = [];

    while (jobStatus === 'IN_PROGRESS' && attempts < maxAttempts) {
      attempts++;
      console.log(`Polling attempt ${attempts}, waiting 10 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

      const pollPayload = {
        JobId: jobId
      };

      const pollBody = JSON.stringify(pollPayload);
      const pollHeaders = {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'Textract.GetDocumentTextDetection',
        'Host': host,
        'Content-Length': pollBody.length.toString()
      };

      const signedPollHeaders = await signer.signRequest(method, host, path, pollBody, pollHeaders);

      const pollResponse = await fetch(`https://${host}${path}`, {
        method: method,
        headers: signedPollHeaders,
        body: pollBody
      });

      if (!pollResponse.ok) {
        const errorText = await pollResponse.text();
        console.error('Textract poll error:', pollResponse.status, errorText);
        throw new Error(`Textract poll failed: ${pollResponse.status}: ${errorText}`);
      }

      const pollData = await pollResponse.json();
      jobStatus = pollData.JobStatus;
      
      console.log('Job status:', jobStatus);

      if (jobStatus === 'SUCCEEDED') {
        console.log('Async job completed successfully');
        
        // Collect all blocks (handle pagination if needed)
        if (pollData.Blocks) {
          allBlocks = [...allBlocks, ...pollData.Blocks];
        }

        // Handle pagination
        let nextToken = pollData.NextToken;
        while (nextToken) {
          console.log('Fetching next page of results...');
          
          const nextPayload = {
            JobId: jobId,
            NextToken: nextToken
          };

          const nextBody = JSON.stringify(nextPayload);
          const nextHeaders = {
            'Content-Type': 'application/x-amz-json-1.1',
            'X-Amz-Target': 'Textract.GetDocumentTextDetection',
            'Host': host,
            'Content-Length': nextBody.length.toString()
          };

          const signedNextHeaders = await signer.signRequest(method, host, path, nextBody, nextHeaders);

          const nextResponse = await fetch(`https://${host}${path}`, {
            method: method,
            headers: signedNextHeaders,
            body: nextBody
          });

          if (!nextResponse.ok) {
            console.error('Error fetching next page');
            break;
          }

          const nextData = await nextResponse.json();
          if (nextData.Blocks) {
            allBlocks = [...allBlocks, ...nextData.Blocks];
          }
          nextToken = nextData.NextToken;
        }

        break;
      } else if (jobStatus === 'FAILED') {
        throw new Error(`Async Textract job failed: ${pollData.StatusMessage || 'Unknown error'}`);
      }
    }

    if (jobStatus === 'IN_PROGRESS') {
      throw new Error('Async job timed out after maximum polling attempts');
    }

    // Step 3: Extract text from all blocks
    let extractedText = '';
    let totalConfidence = 0;
    let lineCount = 0;

    for (const block of allBlocks) {
      if (block.BlockType === 'LINE' && block.Text) {
        extractedText += block.Text + '\n';
        if (block.Confidence) {
          totalConfidence += block.Confidence;
          lineCount++;
        }
      }
    }

    const averageConfidence = lineCount > 0 ? totalConfidence / lineCount : 0;

    console.log(`Async Textract extraction successful: ${extractedText.length} characters from ${lineCount} lines with ${averageConfidence.toFixed(1)}% confidence`);

    return {
      text: extractedText.trim(),
      confidence: averageConfidence,
      method: 'textract-async',
      metadata: {
        totalBlocks: allBlocks.length,
        lineBlocks: lineCount,
        jobId: jobId,
        implementation: 'async-api',
        pollingAttempts: attempts
      }
    };

  } catch (error) {
    console.error('Async Textract processing error:', error);
    throw new Error(`Async Textract processing failed: ${error.message}`);
  }
}
