
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

    console.log('Starting Textract extraction for material:', materialId);

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
  
  // Create AWS signature
  const endpoint = `https://textract.${region}.amazonaws.com/`;
  const service = 'textract';
  const method = 'POST';
  const headers = {
    'Content-Type': 'application/x-amz-json-1.1',
    'X-Amz-Target': 'Textract.DetectDocumentText'
  };

  const body = JSON.stringify({
    Document: {
      Bytes: Array.from(uint8Array)
    }
  });

  const signedRequest = await createAWSSignedRequest(
    method, endpoint, headers, body, accessKeyId, secretAccessKey, region, service
  );

  const response = await fetch(endpoint, signedRequest);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Textract API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  // Extract text and calculate average confidence
  let extractedText = '';
  let totalConfidence = 0;
  let blockCount = 0;

  if (data.Blocks) {
    for (const block of data.Blocks) {
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

  return {
    text: extractedText.trim(),
    confidence: averageConfidence,
    method: 'textract-sync',
    metadata: {
      totalBlocks: data.Blocks?.length || 0,
      textBlocks: blockCount
    }
  };
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

async function createAWSSignedRequest(
  method: string,
  url: string,
  headers: Record<string, string>,
  body: string,
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  service: string
) {
  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStamp = now.toISOString().slice(0, 19).replace(/[-:]/g, '') + 'Z';
  
  // Create canonical request
  const canonicalHeaders = Object.entries(headers)
    .map(([key, value]) => `${key.toLowerCase()}:${value}`)
    .sort()
    .join('\n') + '\n';
    
  const signedHeaders = Object.keys(headers)
    .map(key => key.toLowerCase())
    .sort()
    .join(';');

  const hashedPayload = await sha256(body);
  
  const canonicalRequest = [
    method,
    '/',
    '',
    canonicalHeaders,
    signedHeaders,
    hashedPayload
  ].join('\n');

  // Create string to sign
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    timeStamp,
    credentialScope,
    await sha256(canonicalRequest)
  ].join('\n');

  // Calculate signature
  const signature = await calculateSignature(secretAccessKey, dateStamp, region, service, stringToSign);
  
  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    method,
    headers: {
      ...headers,
      'Authorization': authorizationHeader,
      'X-Amz-Date': timeStamp
    },
    body
  };
}

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function calculateSignature(
  secretAccessKey: string,
  dateStamp: string,
  region: string,
  service: string,
  stringToSign: string
): Promise<string> {
  const encoder = new TextEncoder();
  
  let key = encoder.encode('AWS4' + secretAccessKey);
  key = await hmacSha256(key, dateStamp);
  key = await hmacSha256(key, region);
  key = await hmacSha256(key, service);
  key = await hmacSha256(key, 'aws4_request');
  
  const signature = await hmacSha256(key, stringToSign);
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256(key: Uint8Array | ArrayBuffer, message: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
}
