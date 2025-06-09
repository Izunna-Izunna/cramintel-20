
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { TextractClient, DetectDocumentTextCommand } from 'https://esm.sh/@aws-sdk/client-textract@3.0.0';
import { Sha256 } from 'https://esm.sh/@aws-crypto/sha256-js@3.0.0';

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
  
  // Create Textract client with SHA256 polyfill for Deno compatibility
  const textractClient = new TextractClient({
    region: region,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey
    },
    // Override the default Node-only hash implementation with pure JS
    sha256: Sha256
  });

  try {
    console.log('Calling Textract with polyfilled SHA256 implementation');
    
    const command = new DetectDocumentTextCommand({
      Document: {
        Bytes: uint8Array
      }
    });

    const response = await textractClient.send(command);
    
    // Extract text and calculate average confidence
    let extractedText = '';
    let totalConfidence = 0;
    let blockCount = 0;

    if (response.Blocks) {
      for (const block of response.Blocks) {
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

    console.log(`Textract extraction successful: ${extractedText.length} characters extracted with ${averageConfidence.toFixed(1)}% confidence`);

    return {
      text: extractedText.trim(),
      confidence: averageConfidence,
      method: 'textract-sync',
      metadata: {
        totalBlocks: response.Blocks?.length || 0,
        textBlocks: blockCount,
        sdkVersion: 'aws-sdk-v3-with-sha256-polyfill'
      }
    };
  } catch (error) {
    console.error('Textract processing error:', error);
    throw new Error(`Textract processing failed: ${error.message}`);
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
