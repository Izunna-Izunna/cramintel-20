
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { 
  TextractClient, 
  DetectDocumentTextCommand, 
  StartDocumentTextDetectionCommand,
  GetDocumentTextDetectionCommand 
} from 'https://esm.sh/@aws-sdk/client-textract@3.826.0';
import { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand 
} from 'https://esm.sh/@aws-sdk/client-s3@3.826.0';
import { getSignedUrl } from 'https://esm.sh/@aws-sdk/s3-request-presigner@3.826.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TextractResponse {
  text: string;
  confidence: number;
  method: 'textract-sync' | 'textract-async-s3' | 'fallback';
  metadata?: any;
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
      console.log('Processing PDF with S3-based async Textract');
      extractionResult = await processPdfWithS3(fileBuffer, filePath, awsAccessKeyId, awsSecretAccessKey, awsRegion, supabase);
    } else if (isImageFile(fileType)) {
      console.log('Processing image with sync Textract API');
      extractionResult = await processImageSync(fileBuffer, awsAccessKeyId, awsSecretAccessKey, awsRegion);
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

async function processImageSync(
  fileBuffer: ArrayBuffer, 
  accessKeyId: string, 
  secretAccessKey: string, 
  region: string
): Promise<TextractResponse> {
  
  try {
    console.log('Using sync Textract DetectDocumentText for image');
    
    const textractClient = new TextractClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });

    const uint8Array = new Uint8Array(fileBuffer);
    
    const command = new DetectDocumentTextCommand({
      Document: {
        Bytes: uint8Array
      }
    });

    const response = await textractClient.send(command);
    
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

    console.log(`Sync Textract extraction successful: ${extractedText.length} characters with ${averageConfidence.toFixed(1)}% confidence`);

    return {
      text: extractedText.trim(),
      confidence: averageConfidence,
      method: 'textract-sync',
      metadata: {
        totalBlocks: response.Blocks?.length || 0,
        textBlocks: blockCount,
        implementation: 'sync-api'
      }
    };
  } catch (error) {
    console.error('Sync Textract processing error:', error);
    throw new Error(`Sync Textract processing failed: ${error.message}`);
  }
}

async function processPdfWithS3(
  fileBuffer: ArrayBuffer,
  originalPath: string,
  accessKeyId: string, 
  secretAccessKey: string, 
  region: string,
  supabase: any
): Promise<TextractResponse> {
  
  const s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });

  const textractClient = new TextractClient({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });

  // Use a temporary bucket name - you might want to make this configurable
  const bucketName = 'cramintel-textract-temp';
  const key = `temp/${crypto.randomUUID()}_${originalPath.split('/').pop()}`;

  try {
    console.log('Uploading PDF to S3 for Textract processing...');
    
    // Upload file to S3
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: new Uint8Array(fileBuffer),
      ContentType: 'application/pdf'
    });

    await s3Client.send(putCommand);
    console.log('PDF uploaded to S3:', `s3://${bucketName}/${key}`);

    // Start Textract job
    console.log('Starting async Textract job...');
    const startCommand = new StartDocumentTextDetectionCommand({
      DocumentLocation: {
        S3Object: {
          Bucket: bucketName,
          Name: key
        }
      },
      ClientRequestToken: crypto.randomUUID(),
      JobTag: key
    });

    const startResponse = await textractClient.send(startCommand);
    const jobId = startResponse.JobId;
    
    if (!jobId) {
      throw new Error('No JobId returned from StartDocumentTextDetection');
    }

    console.log('Async job started with ID:', jobId);

    // Poll for completion
    let jobStatus = 'IN_PROGRESS';
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max
    let allBlocks: any[] = [];

    while (jobStatus === 'IN_PROGRESS' && attempts < maxAttempts) {
      attempts++;
      console.log(`Polling attempt ${attempts}, waiting 10 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

      const getCommand = new GetDocumentTextDetectionCommand({
        JobId: jobId
      });

      const pollResponse = await textractClient.send(getCommand);
      jobStatus = pollResponse.JobStatus || 'IN_PROGRESS';
      
      console.log('Job status:', jobStatus);

      if (jobStatus === 'SUCCEEDED') {
        console.log('Async job completed successfully');
        
        // Collect all blocks (handle pagination)
        if (pollResponse.Blocks) {
          allBlocks = [...allBlocks, ...pollResponse.Blocks];
        }

        // Handle pagination
        let nextToken = pollResponse.NextToken;
        while (nextToken) {
          console.log('Fetching next page of results...');
          
          const nextCommand = new GetDocumentTextDetectionCommand({
            JobId: jobId,
            NextToken: nextToken
          });

          const nextResponse = await textractClient.send(nextCommand);
          if (nextResponse.Blocks) {
            allBlocks = [...allBlocks, ...nextResponse.Blocks];
          }
          nextToken = nextResponse.NextToken;
        }

        break;
      } else if (jobStatus === 'FAILED') {
        throw new Error(`Async Textract job failed: ${pollResponse.StatusMessage || 'Unknown error'}`);
      }
    }

    if (jobStatus === 'IN_PROGRESS') {
      throw new Error('Async job timed out after maximum polling attempts');
    }

    // Extract text from all blocks
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

    console.log(`S3-based async Textract extraction successful: ${extractedText.length} characters from ${lineCount} lines with ${averageConfidence.toFixed(1)}% confidence`);

    return {
      text: extractedText.trim(),
      confidence: averageConfidence,
      method: 'textract-async-s3',
      metadata: {
        totalBlocks: allBlocks.length,
        lineBlocks: lineCount,
        jobId: jobId,
        s3Location: `s3://${bucketName}/${key}`,
        implementation: 'async-s3-api',
        pollingAttempts: attempts
      }
    };

  } catch (error) {
    console.error('S3-based async Textract processing error:', error);
    throw new Error(`S3-based async Textract processing failed: ${error.message}`);
  } finally {
    // Clean up temporary S3 object
    try {
      console.log('Cleaning up temporary S3 object...');
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key
      });
      await s3Client.send(deleteCommand);
      console.log('Temporary S3 object cleaned up');
    } catch (cleanupError) {
      console.error('Failed to clean up S3 object:', cleanupError);
      // Don't throw here, as the main operation succeeded
    }
  }
}
