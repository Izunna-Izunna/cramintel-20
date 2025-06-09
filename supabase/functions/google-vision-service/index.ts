
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VisionResponse {
  text: string;
  confidence: number;
  method: string;
  boundingBoxes?: any[];
  metadata?: any;
  processingTime?: number;
  debugInfo?: any;
}

interface DetailedError {
  error: string;
  details: string;
  errorCode: string;
  debugInfo?: any;
  timestamp: string;
}

// Utility function to convert ArrayBuffer to base64 in chunks
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const startTime = Date.now();
  console.log('Starting base64 conversion for buffer size:', buffer.byteLength);
  
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192;
  let binary = '';
  
  try {
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    const base64 = btoa(binary);
    const conversionTime = Date.now() - startTime;
    console.log('Base64 conversion completed in:', conversionTime, 'ms. Output size:', base64.length);
    
    return base64;
  } catch (error) {
    console.error('Base64 conversion failed:', error);
    throw new Error(`Base64 conversion failed: ${error.message}`);
  }
}

function createDetailedError(
  error: string, 
  details: string, 
  errorCode: string, 
  debugInfo?: any
): DetailedError {
  return {
    error,
    details,
    errorCode,
    debugInfo,
    timestamp: new Date().toISOString()
  };
}

serve(async (req) => {
  const requestStartTime = Date.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Google Vision Service Request Started ===');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { filePath, fileType } = await req.json();
    console.log('Processing request:', { filePath, fileType, timestamp: new Date().toISOString() });

    if (!filePath || !fileType) {
      const error = createDetailedError(
        'Missing required parameters',
        'Both filePath and fileType must be provided',
        'MISSING_PARAMS',
        { receivedFilePath: !!filePath, receivedFileType: !!fileType }
      );
      console.error('Parameter validation failed:', error);
      return new Response(JSON.stringify(error), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY');
    if (!apiKey) {
      const error = createDetailedError(
        'Google Cloud Vision API key not configured',
        'GOOGLE_CLOUD_VISION_API_KEY environment variable is missing',
        'API_KEY_MISSING'
      );
      console.error('API key validation failed:', error);
      return new Response(JSON.stringify(error), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Downloading file from Supabase storage...');
    const downloadStartTime = Date.now();
    
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('cramintel-materials')
      .download(filePath);

    const downloadTime = Date.now() - downloadStartTime;
    console.log('File download completed in:', downloadTime, 'ms');

    if (downloadError || !fileData) {
      const error = createDetailedError(
        'Failed to download file',
        downloadError?.message || 'File not found in storage',
        'DOWNLOAD_FAILED',
        { 
          downloadError, 
          filePath,
          downloadTime 
        }
      );
      console.error('File download failed:', error);
      return new Response(JSON.stringify(error), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const fileSize = fileData.size;
    console.log('File downloaded successfully:', {
      size: fileSize,
      sizeInMB: Math.round(fileSize / 1024 / 1024 * 100) / 100,
      type: fileType
    });

    // Enhanced file size validation
    if (fileSize > 20 * 1024 * 1024) {
      const error = createDetailedError(
        'File too large',
        `File size ${Math.round(fileSize / 1024 / 1024 * 100) / 100}MB exceeds 20MB limit`,
        'FILE_TOO_LARGE',
        { fileSize, maxSize: 20 * 1024 * 1024 }
      );
      console.error('File size validation failed:', error);
      return new Response(JSON.stringify(error), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let visionResponse: VisionResponse;
    const processingStartTime = Date.now();

    if (fileType.includes('image')) {
      console.log('Processing as image file');
      visionResponse = await processImageSync(fileData, apiKey, fileSize);
    } else if (fileType.includes('pdf')) {
      console.log('Processing as PDF file');
      visionResponse = await processPdfWithEnhancedFallback(fileData, apiKey, fileSize);
    } else {
      const error = createDetailedError(
        'Unsupported file type',
        `File type ${fileType} is not supported. Only images and PDFs are supported.`,
        'UNSUPPORTED_FILE_TYPE',
        { fileType }
      );
      console.error('File type validation failed:', error);
      return new Response(JSON.stringify(error), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const totalProcessingTime = Date.now() - requestStartTime;
    visionResponse.processingTime = totalProcessingTime;

    console.log('=== Vision processing completed successfully ===', {
      method: visionResponse.method,
      confidence: visionResponse.confidence,
      textLength: visionResponse.text.length,
      totalTime: totalProcessingTime + 'ms'
    });

    return new Response(JSON.stringify({
      success: true,
      ...visionResponse
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const totalTime = Date.now() - requestStartTime;
    console.error('=== CRITICAL ERROR in google-vision-service ===', {
      error: error.message,
      stack: error.stack,
      totalTime: totalTime + 'ms',
      timestamp: new Date().toISOString()
    });
    
    let errorDetails = createDetailedError(
      error.message || 'Unknown error occurred',
      'Vision service processing failed',
      'PROCESSING_FAILED',
      {
        stack: error.stack,
        processingTime: totalTime
      }
    );
    
    // Enhanced error categorization
    if (error.message?.includes('BILLING_DISABLED')) {
      errorDetails = createDetailedError(
        'Google Cloud billing disabled',
        'Please enable billing on your Google Cloud project and wait for changes to propagate',
        'BILLING_DISABLED'
      );
    } else if (error.message?.includes('API_KEY_INVALID')) {
      errorDetails = createDetailedError(
        'Invalid Google Cloud Vision API key',
        'Please check your API key configuration',
        'API_KEY_INVALID'
      );
    } else if (error.message?.includes('PERMISSION_DENIED')) {
      errorDetails = createDetailedError(
        'Permission denied',
        'Please check that the Vision API is enabled and your API key has proper permissions',
        'PERMISSION_DENIED'
      );
    }
    
    return new Response(JSON.stringify(errorDetails), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processImageSync(fileData: Blob, apiKey: string, fileSize: number): Promise<VisionResponse> {
  console.log('=== Starting image processing ===');
  const startTime = Date.now();
  
  try {
    const arrayBuffer = await fileData.arrayBuffer();
    console.log('ArrayBuffer created, size:', arrayBuffer.byteLength);
    
    const base64Content = arrayBufferToBase64(arrayBuffer);
    const base64Size = base64Content.length;
    
    // Enhanced size validation
    const estimatedJsonSize = base64Size * 1.37;
    console.log('Size analysis:', {
      originalSize: fileSize,
      base64Size: base64Size,
      estimatedJsonSize: Math.round(estimatedJsonSize / 1024 / 1024 * 100) / 100 + 'MB'
    });
    
    if (estimatedJsonSize > 10 * 1024 * 1024) {
      throw new Error(`Image too large for processing: estimated JSON size ${Math.round(estimatedJsonSize / 1024 / 1024)}MB exceeds 10MB limit`);
    }

    const visionRequest = {
      requests: [{
        image: { content: base64Content },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }]
      }]
    };

    console.log('Sending request to Google Vision API...');
    const apiStartTime = Date.now();
    
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visionRequest)
    });

    const apiTime = Date.now() - apiStartTime;
    console.log('Google Vision API response received in:', apiTime, 'ms', {
      status: response.status,
      statusText: response.statusText
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vision API error response:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText,
        apiTime
      });
      
      let errorMessage = `Vision API failed: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.details) {
          const billingError = errorData.error.details.find((detail: any) => 
            detail.reason === 'BILLING_DISABLED'
          );
          if (billingError) {
            throw new Error(`BILLING_DISABLED: ${errorData.error.message}`);
          }
        }
        errorMessage += ` - ${errorData.error?.message || errorText}`;
      } catch (parseError) {
        errorMessage += ` - ${errorText}`;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Vision API response parsed successfully');
    
    const annotation = result.responses[0];
    if (annotation.error) {
      console.error('Vision API annotation error:', annotation.error);
      throw new Error(`Vision API annotation error: ${annotation.error.message}`);
    }

    const fullTextAnnotation = annotation.fullTextAnnotation;
    if (!fullTextAnnotation || !fullTextAnnotation.text) {
      console.log('No text detected in image');
      return {
        text: '',
        confidence: 0,
        method: 'google-vision-sync',
        metadata: { message: 'No text detected in image' },
        processingTime: Date.now() - startTime,
        debugInfo: { apiTime, totalProcessingTime: Date.now() - startTime }
      };
    }

    // Calculate confidence
    let totalConfidence = 0;
    let blockCount = 0;
    
    if (fullTextAnnotation.pages) {
      for (const page of fullTextAnnotation.pages) {
        if (page.blocks) {
          for (const block of page.blocks) {
            if (block.confidence !== undefined) {
              totalConfidence += block.confidence;
              blockCount++;
            }
          }
        }
      }
    }

    const averageConfidence = blockCount > 0 ? Math.round((totalConfidence / blockCount) * 100) : 80;
    const processingTime = Date.now() - startTime;
    
    console.log('=== Image processing completed ===', {
      textLength: fullTextAnnotation.text.length,
      blockCount,
      averageConfidence,
      processingTime: processingTime + 'ms'
    });

    return {
      text: fullTextAnnotation.text,
      confidence: Math.max(averageConfidence, 75),
      method: 'google-vision-sync',
      boundingBoxes: annotation.textAnnotations,
      metadata: {
        detectedLanguages: fullTextAnnotation.pages?.[0]?.property?.detectedLanguages,
        blockCount
      },
      processingTime,
      debugInfo: { apiTime, blockCount, averageConfidence }
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Image processing failed:', error, { processingTime: processingTime + 'ms' });
    throw error;
  }
}

async function processPdfWithEnhancedFallback(fileData: Blob, apiKey: string, fileSize: number): Promise<VisionResponse> {
  console.log('=== Starting enhanced PDF processing ===');
  const startTime = Date.now();
  
  const attempts = [
    { method: 'TEXT_DETECTION', maxSize: 4 * 1024 * 1024, description: 'Simple text detection' },
    { method: 'DOCUMENT_TEXT_DETECTION', maxSize: 6 * 1024 * 1024, description: 'Document text detection' }
  ];

  for (const attempt of attempts) {
    if (fileSize > attempt.maxSize) {
      console.log(`Skipping ${attempt.method}: file too large (${Math.round(fileSize / 1024)}KB > ${Math.round(attempt.maxSize / 1024)}KB)`);
      continue;
    }

    console.log(`=== Attempting PDF processing with ${attempt.method} ===`);
    const attemptStartTime = Date.now();

    try {
      const arrayBuffer = await fileData.arrayBuffer();
      console.log('PDF ArrayBuffer created, size:', arrayBuffer.byteLength);
      
      const base64Content = arrayBufferToBase64(arrayBuffer);
      const base64Size = base64Content.length;
      
      console.log('PDF base64 conversion completed:', {
        originalSize: fileSize,
        base64Size: base64Size,
        method: attempt.method
      });

      const visionRequest = {
        requests: [{
          image: { content: base64Content },
          features: [{ type: attempt.method, maxResults: 1 }]
        }]
      };

      console.log(`Sending ${attempt.method} request to Google Vision API...`);
      const apiStartTime = Date.now();
      
      const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visionRequest)
      });

      const apiTime = Date.now() - apiStartTime;
      console.log(`${attempt.method} API response:`, {
        status: response.status,
        statusText: response.statusText,
        apiTime: apiTime + 'ms'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`${attempt.method} API error:`, {
          status: response.status,
          errorText: errorText
        });
        continue; // Try next method
      }

      const result = await response.json();
      const annotation = result.responses[0];

      if (annotation.error) {
        console.log(`${attempt.method} annotation error:`, annotation.error.message);
        continue; // Try next method
      }

      let extractedText = '';
      let confidence = 75;

      if (attempt.method === 'TEXT_DETECTION') {
        if (annotation.textAnnotations && annotation.textAnnotations.length > 0) {
          extractedText = annotation.textAnnotations[0].description || '';
          confidence = 85;
        }
      } else if (attempt.method === 'DOCUMENT_TEXT_DETECTION') {
        if (annotation.fullTextAnnotation?.text) {
          extractedText = annotation.fullTextAnnotation.text;
          confidence = 80;
        }
      }

      if (extractedText.length > 50) {
        const processingTime = Date.now() - startTime;
        console.log(`=== PDF processing successful with ${attempt.method} ===`, {
          textLength: extractedText.length,
          confidence,
          processingTime: processingTime + 'ms'
        });

        return {
          text: extractedText,
          confidence,
          method: `google-vision-pdf-${attempt.method.toLowerCase()}`,
          boundingBoxes: annotation.textAnnotations,
          metadata: {
            pdfSize: fileSize,
            detectionType: attempt.method,
            attemptUsed: attempt.description
          },
          processingTime,
          debugInfo: { 
            apiTime, 
            method: attempt.method, 
            textLength: extractedText.length 
          }
        };
      } else {
        console.log(`${attempt.method} returned insufficient text (${extractedText.length} chars), trying next method`);
      }

    } catch (attemptError) {
      const attemptTime = Date.now() - attemptStartTime;
      console.error(`${attempt.method} failed:`, {
        error: attemptError.message,
        attemptTime: attemptTime + 'ms'
      });
      // Continue to next method
    }
  }

  // All attempts failed
  const totalTime = Date.now() - startTime;
  console.error('=== All PDF processing attempts failed ===', {
    fileSize: Math.round(fileSize / 1024) + 'KB',
    totalTime: totalTime + 'ms',
    attemptsCount: attempts.length
  });

  throw new Error(`PDF processing failed: Unable to extract text using any method. File size: ${Math.round(fileSize / 1024)}KB. This PDF may contain scanned images, be corrupted, or in an unsupported format. Try converting to images or a different PDF format.`);
}
