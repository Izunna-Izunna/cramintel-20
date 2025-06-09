
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

// Enhanced PDF text extraction using proper PDF parsing
async function extractTextFromPdfProperly(fileData: Blob): Promise<{ text: string; confidence: number; method: string; }> {
  console.log('Attempting enhanced PDF text extraction...');
  
  try {
    const arrayBuffer = await fileData.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);
    
    // Convert to string for pattern matching
    const pdfString = new TextDecoder('latin1').decode(pdfBytes);
    
    // Enhanced PDF text extraction strategies
    let extractedText = '';
    let extractionMethod = 'enhanced-pdf-parsing';
    
    // Strategy 1: Extract from text objects (Tj and TJ operators)
    const textObjectRegex = /\[(.*?)\]\s*TJ|(?:\((.*?)\)|\<(.*?)\>)\s*Tj/gi;
    let match;
    const textFragments: string[] = [];
    
    while ((match = textObjectRegex.exec(pdfString)) !== null) {
      if (match[1]) {
        // Array format [text] TJ
        const arrayContent = match[1];
        const textMatches = arrayContent.match(/\((.*?)\)/g);
        if (textMatches) {
          textMatches.forEach(textMatch => {
            const cleanText = textMatch.slice(1, -1); // Remove parentheses
            if (cleanText.length > 0) {
              textFragments.push(cleanText);
            }
          });
        }
      } else if (match[2]) {
        // Parentheses format (text) Tj
        textFragments.push(match[2]);
      } else if (match[3]) {
        // Hex format <text> Tj
        try {
          const hexText = match[3];
          const decodedText = hexText.match(/.{2}/g)?.map(hex => 
            String.fromCharCode(parseInt(hex, 16))
          ).join('') || '';
          if (decodedText.length > 0) {
            textFragments.push(decodedText);
          }
        } catch (e) {
          // Skip invalid hex
        }
      }
    }
    
    // Strategy 2: Extract from stream objects with better filtering
    const streamRegex = /stream\s*([\s\S]*?)\s*endstream/gi;
    const streamMatches = pdfString.match(streamRegex);
    
    if (streamMatches) {
      streamMatches.forEach(stream => {
        const content = stream.replace(/^stream\s*/, '').replace(/\s*endstream$/, '');
        
        // Look for readable text patterns
        const readableMatches = content.match(/[a-zA-Z]{3,}[\s\w\.,;:!?\-\(\)]*[a-zA-Z]/g);
        if (readableMatches) {
          readableMatches.forEach(text => {
            // Filter out control sequences and ensure minimum quality
            if (text.length > 3 && !/^[\x00-\x1F\x7F-\xFF]+$/.test(text)) {
              textFragments.push(text);
            }
          });
        }
      });
    }
    
    // Strategy 3: Look for BT/ET (Begin Text/End Text) blocks
    const textBlockRegex = /BT([\s\S]*?)ET/gi;
    const textBlocks = pdfString.match(textBlockRegex);
    
    if (textBlocks) {
      textBlocks.forEach(block => {
        const textInBlock = block.match(/\((.*?)\)/g);
        if (textInBlock) {
          textInBlock.forEach(text => {
            const cleanText = text.slice(1, -1); // Remove parentheses
            if (cleanText.length > 2) {
              textFragments.push(cleanText);
            }
          });
        }
      });
    }
    
    // Combine and clean extracted text
    if (textFragments.length > 0) {
      extractedText = textFragments
        .filter(fragment => fragment.trim().length > 0)
        .join(' ')
        .replace(/\s+/g, ' ')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
        .trim();
        
      // Quality check: ensure we have meaningful content
      const wordCount = extractedText.split(/\s+/).filter(word => word.length > 2).length;
      const alphaRatio = (extractedText.match(/[a-zA-Z]/g) || []).length / extractedText.length;
      
      if (wordCount < 10 || alphaRatio < 0.3) {
        console.log('Extracted text quality too low, trying fallback method');
        extractedText = '';
      }
    }
    
    // Fallback: Simple regex-based extraction
    if (extractedText.length < 100) {
      console.log('Primary extraction insufficient, trying simple fallback...');
      const simpleTextMatches = pdfString.match(/[A-Za-z][A-Za-z\s\.,;:!?\-\(\)]{10,}/g);
      if (simpleTextMatches) {
        const fallbackText = simpleTextMatches
          .filter(text => text.trim().length > 10)
          .slice(0, 50) // Limit to prevent too much noise
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
          
        if (fallbackText.length > extractedText.length) {
          extractedText = fallbackText;
          extractionMethod = 'simple-regex-fallback';
        }
      }
    }
    
    const confidence = extractedText.length > 1000 ? 85 : 
                     extractedText.length > 500 ? 75 : 
                     extractedText.length > 100 ? 65 : 45;
    
    console.log('Enhanced PDF extraction result:', {
      textLength: extractedText.length,
      fragmentsFound: textFragments.length,
      confidence,
      method: extractionMethod,
      preview: extractedText.substring(0, 200)
    });
    
    return {
      text: extractedText,
      confidence,
      method: extractionMethod
    };
    
  } catch (error) {
    console.error('Enhanced PDF extraction failed:', error);
    return {
      text: '',
      confidence: 0,
      method: 'enhanced-pdf-failed'
    };
  }
}

// Quality assessment for extracted text
function assessTextQuality(text: string): { isReadable: boolean; confidence: number; metrics: any } {
  if (!text || text.length < 10) {
    return { isReadable: false, confidence: 0, metrics: { reason: 'too_short' } };
  }
  
  const totalChars = text.length;
  const alphaChars = (text.match(/[a-zA-Z]/g) || []).length;
  const digitChars = (text.match(/\d/g) || []).length;
  const spaceChars = (text.match(/\s/g) || []).length;
  const punctChars = (text.match(/[.,;:!?]/g) || []).length;
  const controlChars = (text.match(/[\x00-\x1F\x7F-\xFF]/g) || []).length;
  
  const alphaRatio = alphaChars / totalChars;
  const controlRatio = controlChars / totalChars;
  const wordCount = text.split(/\s+/).filter(w => w.length > 2).length;
  
  const metrics = {
    totalChars,
    alphaRatio: Math.round(alphaRatio * 100) / 100,
    controlRatio: Math.round(controlRatio * 100) / 100,
    wordCount,
    hasRepeatingPatterns: /(.{3,})\1{3,}/.test(text),
    avgWordLength: wordCount > 0 ? Math.round(alphaChars / wordCount) : 0
  };
  
  // Determine if text is readable
  const isReadable = alphaRatio > 0.4 && 
                    controlRatio < 0.1 && 
                    wordCount > 5 && 
                    !metrics.hasRepeatingPatterns &&
                    metrics.avgWordLength >= 3 &&
                    metrics.avgWordLength <= 15;
  
  const confidence = isReadable ? 
    Math.min(95, 50 + (alphaRatio * 30) + (Math.min(wordCount, 100) * 0.15)) : 
    Math.max(10, alphaRatio * 40);
  
  return { isReadable, confidence: Math.round(confidence), metrics };
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
      visionResponse = await processPdfWithEnhancedExtraction(fileData, apiKey, fileSize);
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

async function processPdfWithEnhancedExtraction(fileData: Blob, apiKey: string, fileSize: number): Promise<VisionResponse> {
  console.log('=== Starting enhanced PDF processing ===');
  const startTime = Date.now();
  
  // Step 1: Try enhanced PDF text extraction first
  console.log('Step 1: Attempting enhanced PDF text extraction...');
  const enhancedResult = await extractTextFromPdfProperly(fileData);
  
  if (enhancedResult.text && enhancedResult.text.length > 0) {
    const qualityAssessment = assessTextQuality(enhancedResult.text);
    
    console.log('Enhanced PDF extraction result:', {
      textLength: enhancedResult.text.length,
      method: enhancedResult.method,
      confidence: enhancedResult.confidence,
      qualityAssessment,
      preview: enhancedResult.text.substring(0, 300)
    });
    
    // If we have good quality text, return it
    if (qualityAssessment.isReadable && enhancedResult.text.length > 200) {
      return {
        text: enhancedResult.text,
        confidence: Math.max(enhancedResult.confidence, qualityAssessment.confidence),
        method: enhancedResult.method,
        metadata: {
          pdfSize: fileSize,
          extractionType: 'enhanced-parsing',
          qualityMetrics: qualityAssessment.metrics
        },
        processingTime: Date.now() - startTime,
        debugInfo: { 
          method: enhancedResult.method,
          textLength: enhancedResult.text.length,
          qualityAssessment
        }
      };
    }
  }
  
  console.log('Enhanced extraction insufficient, trying Google Vision API...');
  
  // Step 2: Try Google Vision API with better size handling
  if (fileSize <= 4 * 1024 * 1024) { // Only try Vision API for smaller PDFs
    try {
      console.log('=== Attempting Google Vision API for PDF ===');
      const visionStartTime = Date.now();

      const arrayBuffer = await fileData.arrayBuffer();
      const base64Content = arrayBufferToBase64(arrayBuffer);
      
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
      console.log('Google Vision API response:', {
        status: response.status,
        visionTime: visionTime + 'ms'
      });

      if (response.ok) {
        const result = await response.json();
        const annotation = result.responses[0];

        if (!annotation.error && annotation.fullTextAnnotation?.text) {
          const visionText = annotation.fullTextAnnotation.text;
          const visionQuality = assessTextQuality(visionText);
          
          // Compare with enhanced extraction results
          if (visionQuality.isReadable && visionText.length > enhancedResult.text.length) {
            console.log('Google Vision provided better results');
            return {
              text: visionText,
              confidence: Math.min(90, visionQuality.confidence),
              method: 'google-vision-pdf',
              boundingBoxes: annotation.textAnnotations,
              metadata: {
                pdfSize: fileSize,
                detectionType: 'DOCUMENT_TEXT_DETECTION',
                visionProcessingTime: visionTime,
                qualityMetrics: visionQuality.metrics
              },
              processingTime: Date.now() - startTime,
              debugInfo: { 
                visionTime, 
                textLength: visionText.length,
                qualityAssessment: visionQuality
              }
            };
          }
        }
      }
    } catch (visionError) {
      console.log('Google Vision API failed for PDF:', visionError.message);
    }
  } else {
    console.log('PDF too large for Google Vision API, skipping...');
  }

  // Step 3: Return the best result we have, even if not perfect
  if (enhancedResult.text && enhancedResult.text.length > 50) {
    console.log('Returning enhanced extraction result as best available');
    const qualityAssessment = assessTextQuality(enhancedResult.text);
    
    return {
      text: enhancedResult.text,
      confidence: Math.max(45, Math.min(enhancedResult.confidence, qualityAssessment.confidence)),
      method: enhancedResult.method + '-best-effort',
      metadata: {
        pdfSize: fileSize,
        extractionType: 'best-effort',
        qualityMetrics: qualityAssessment.metrics,
        note: 'Partial extraction - may contain formatting artifacts'
      },
      processingTime: Date.now() - startTime,
      debugInfo: { 
        method: enhancedResult.method,
        textLength: enhancedResult.text.length,
        qualityAssessment
      }
    };
  }

  // All extraction methods failed
  const totalTime = Date.now() - startTime;
  console.log('=== All PDF processing attempts failed ===', {
    fileSize: Math.round(fileSize / 1024) + 'KB',
    totalTime: totalTime + 'ms'
  });

  return {
    text: '',
    confidence: 0,
    method: 'pdf-processing-failed',
    metadata: {
      pdfSize: fileSize,
      error: 'Unable to extract readable text using any method',
      note: 'This PDF may contain scanned images, be heavily formatted, or use unsupported encoding'
    },
    processingTime: totalTime,
    debugInfo: { 
      fileSize: Math.round(fileSize / 1024) + 'KB',
      totalTime: totalTime + 'ms',
      enhancedResultLength: enhancedResult.text.length
    }
  };
}
