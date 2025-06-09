
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

// PDF validation to check if PDF is readable/valid
function validatePDF(fileData: Uint8Array): { isValid: boolean; error?: string; metadata?: any } {
  try {
    // Check PDF header
    const header = new TextDecoder('latin1').decode(fileData.slice(0, 8));
    if (!header.startsWith('%PDF-')) {
      return { 
        isValid: false, 
        error: 'Invalid PDF: Missing PDF header signature',
        metadata: { detectedHeader: header }
      };
    }
    
    // Extract PDF version
    const version = header.slice(5, 8);
    console.log('PDF validation - Version detected:', version);
    
    // Check for PDF trailer
    const endData = new TextDecoder('latin1').decode(fileData.slice(-1024));
    const hasTrailer = endData.includes('%%EOF');
    
    if (!hasTrailer) {
      return { 
        isValid: false, 
        error: 'Invalid PDF: Missing EOF marker - file may be corrupted',
        metadata: { version, hasTrailer: false }
      };
    }
    
    // Check file size
    const sizeInMB = fileData.length / (1024 * 1024);
    if (sizeInMB > 20) {
      return { 
        isValid: false, 
        error: `PDF too large: ${sizeInMB.toFixed(2)}MB exceeds 20MB limit`,
        metadata: { version, sizeInMB }
      };
    }
    
    // Basic structure validation
    const pdfString = new TextDecoder('latin1').decode(fileData);
    const hasXref = pdfString.includes('xref');
    const hasRoot = pdfString.includes('/Root');
    
    console.log('PDF validation successful:', {
      version,
      sizeInMB: Math.round(sizeInMB * 100) / 100,
      hasTrailer,
      hasXref,
      hasRoot
    });
    
    return { 
      isValid: true, 
      metadata: { 
        version, 
        sizeInMB: Math.round(sizeInMB * 100) / 100,
        hasTrailer,
        hasXref,
        hasRoot,
        totalSize: fileData.length
      }
    };
    
  } catch (error) {
    console.error('PDF validation error:', error);
    return { 
      isValid: false, 
      error: `PDF validation failed: ${error.message}`,
      metadata: { validationError: error.message }
    };
  }
}

// Simple PDF text extraction as LAST RESORT fallback only
async function extractTextFromPdfFallback(fileData: Blob): Promise<{ text: string; confidence: number; method: string; }> {
  console.log('Using fallback PDF text extraction (last resort)...');
  
  try {
    const arrayBuffer = await fileData.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);
    
    // Convert to string for basic text extraction
    const pdfString = new TextDecoder('latin1').decode(pdfBytes);
    
    // Look for readable text patterns - much more conservative approach
    const textMatches: string[] = [];
    
    // Extract text from basic PDF text objects only
    const simpleTextRegex = /\(([\w\s.,;:!?\-]{10,})\)\s*Tj/gi;
    let match;
    
    while ((match = simpleTextRegex.exec(pdfString)) !== null) {
      const text = match[1].trim();
      if (text.length > 10 && /[a-zA-Z]/.test(text)) {
        textMatches.push(text);
      }
    }
    
    // Also try BT/ET blocks
    const btBlocks = pdfString.match(/BT([\s\S]{0,500}?)ET/gi);
    if (btBlocks) {
      btBlocks.forEach(block => {
        const textInBlock = block.match(/\(([\w\s.,;:!?\-]{5,})\)/g);
        if (textInBlock) {
          textInBlock.forEach(text => {
            const cleanText = text.slice(1, -1).trim();
            if (cleanText.length > 5 && /[a-zA-Z]/.test(cleanText)) {
              textMatches.push(cleanText);
            }
          });
        }
      });
    }
    
    let extractedText = '';
    if (textMatches.length > 0) {
      extractedText = textMatches
        .filter(text => text.length > 5)
        .slice(0, 100) // Limit to prevent garbage
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    const confidence = extractedText.length > 500 ? 30 : 
                     extractedText.length > 100 ? 20 : 10;
    
    console.log('Fallback PDF extraction result:', {
      textLength: extractedText.length,
      fragmentsFound: textMatches.length,
      confidence,
      preview: extractedText.substring(0, 200)
    });
    
    return {
      text: extractedText,
      confidence,
      method: 'fallback-pdf-extraction'
    };
    
  } catch (error) {
    console.error('Fallback PDF extraction failed:', error);
    return {
      text: '',
      confidence: 0,
      method: 'fallback-extraction-failed'
    };
  }
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

    let visionResponse: VisionResponse;
    const processingStartTime = Date.now();

    if (fileType.includes('image')) {
      console.log('Processing as image file');
      visionResponse = await processImageWithGoogleVision(fileData, apiKey, fileSize);
    } else if (fileType.includes('pdf')) {
      console.log('Processing as PDF file - PRIORITIZING Google Vision');
      visionResponse = await processPdfWithGoogleVisionFirst(fileData, apiKey, fileSize);
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

async function processImageWithGoogleVision(fileData: Blob, apiKey: string, fileSize: number): Promise<VisionResponse> {
  console.log('=== Starting image processing with Google Vision ===');
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
        method: 'google-vision-image',
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
      method: 'google-vision-image',
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

async function processPdfWithGoogleVisionFirst(fileData: Blob, apiKey: string, fileSize: number): Promise<VisionResponse> {
  console.log('=== Starting PDF processing with Google Vision FIRST ===');
  const startTime = Date.now();
  
  // Step 1: Validate PDF first
  console.log('Step 1: Validating PDF structure...');
  const arrayBuffer = await fileData.arrayBuffer();
  const pdfBytes = new Uint8Array(arrayBuffer);
  const validation = validatePDF(pdfBytes);
  
  if (!validation.isValid) {
    console.error('PDF validation failed:', validation.error);
    return {
      text: '',
      confidence: 0,
      method: 'pdf-validation-failed',
      metadata: {
        validationError: validation.error,
        pdfSize: fileSize,
        ...validation.metadata
      },
      processingTime: Date.now() - startTime,
      debugInfo: { validationError: validation.error }
    };
  }
  
  console.log('PDF validation successful:', validation.metadata);
  
  // Step 2: Try Google Vision API FIRST (primary method)
  console.log('Step 2: Sending PDF directly to Google Vision API...');
  try {
    const visionStartTime = Date.now();
    
    const base64Content = arrayBufferToBase64(arrayBuffer);
    const estimatedJsonSize = base64Content.length * 1.37;
    
    console.log('PDF size analysis for Vision API:', {
      originalSizeMB: Math.round(fileSize / 1024 / 1024 * 100) / 100,
      base64SizeMB: Math.round(base64Content.length / 1024 / 1024 * 100) / 100,
      estimatedJsonSizeMB: Math.round(estimatedJsonSize / 1024 / 1024 * 100) / 100
    });
    
    // Size check for Vision API
    if (estimatedJsonSize > 10 * 1024 * 1024) {
      console.log('PDF too large for Google Vision API, will use fallback extraction');
      throw new Error('PDF_TOO_LARGE_FOR_VISION');
    }

    const visionRequest = {
      requests: [{
        image: { content: base64Content },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }]
      }]
    };

    console.log('Sending PDF to Google Vision API...');
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visionRequest)
    });

    const visionTime = Date.now() - visionStartTime;
    console.log('Google Vision API response for PDF:', {
      status: response.status,
      statusText: response.statusText,
      visionTime: visionTime + 'ms'
    });

    if (response.ok) {
      const result = await response.json();
      const annotation = result.responses[0];

      if (!annotation.error && annotation.fullTextAnnotation?.text) {
        const visionText = annotation.fullTextAnnotation.text;
        
        // Calculate confidence for Vision API result
        let totalConfidence = 0;
        let blockCount = 0;
        
        if (annotation.fullTextAnnotation.pages) {
          for (const page of annotation.fullTextAnnotation.pages) {
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

        const averageConfidence = blockCount > 0 ? Math.round((totalConfidence / blockCount) * 100) : 85;
        
        console.log('=== Google Vision PDF processing successful ===', {
          textLength: visionText.length,
          blockCount,
          averageConfidence,
          visionTime: visionTime + 'ms',
          preview: visionText.substring(0, 200)
        });
        
        return {
          text: visionText,
          confidence: Math.max(averageConfidence, 75),
          method: 'google-vision-pdf-direct',
          boundingBoxes: annotation.textAnnotations,
          metadata: {
            pdfSize: fileSize,
            detectionType: 'DOCUMENT_TEXT_DETECTION',
            visionProcessingTime: visionTime,
            blockCount,
            pdfValidation: validation.metadata
          },
          processingTime: Date.now() - startTime,
          debugInfo: { 
            visionTime, 
            textLength: visionText.length,
            blockCount,
            averageConfidence
          }
        };
      } else {
        console.log('Google Vision API returned no text for PDF:', annotation.error || 'No text detected');
        throw new Error('VISION_NO_TEXT_DETECTED');
      }
    } else {
      const errorText = await response.text();
      console.error('Google Vision API failed for PDF:', {
        status: response.status,
        error: errorText
      });
      throw new Error(`VISION_API_ERROR: ${response.status}`);
    }
    
  } catch (visionError) {
    console.log('Google Vision API failed for PDF:', visionError.message);
    
    // Step 3: Fallback to manual extraction ONLY if Vision fails
    console.log('Step 3: Using fallback PDF extraction as last resort...');
    
    const fallbackResult = await extractTextFromPdfFallback(fileData);
    
    if (fallbackResult.text && fallbackResult.text.length > 50) {
      console.log('Fallback extraction provided some text:', {
        textLength: fallbackResult.text.length,
        confidence: fallbackResult.confidence,
        preview: fallbackResult.text.substring(0, 200)
      });
      
      return {
        text: fallbackResult.text,
        confidence: fallbackResult.confidence,
        method: fallbackResult.method + '-after-vision-failed',
        metadata: {
          pdfSize: fileSize,
          visionFailureReason: visionError.message,
          pdfValidation: validation.metadata,
          note: 'Google Vision failed, used fallback extraction'
        },
        processingTime: Date.now() - startTime,
        debugInfo: { 
          visionError: visionError.message,
          fallbackMethod: fallbackResult.method,
          textLength: fallbackResult.text.length
        }
      };
    }
  }

  // All methods failed
  const totalTime = Date.now() - startTime;
  console.log('=== All PDF processing methods failed ===', {
    fileSize: Math.round(fileSize / 1024) + 'KB',
    totalTime: totalTime + 'ms'
  });

  return {
    text: '',
    confidence: 0,
    method: 'all-pdf-methods-failed',
    metadata: {
      pdfSize: fileSize,
      pdfValidation: validation.metadata,
      error: 'All PDF processing methods failed - this PDF may contain only images or be heavily encrypted',
      note: 'Both Google Vision and fallback extraction failed to extract readable text'
    },
    processingTime: totalTime,
    debugInfo: { 
      fileSize: Math.round(fileSize / 1024) + 'KB',
      totalTime: totalTime + 'ms',
      pdfValidation: validation.metadata
    }
  };
}
