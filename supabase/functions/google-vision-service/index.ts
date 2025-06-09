
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
}

// Utility function to convert ArrayBuffer to base64 in chunks to avoid stack overflow
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192; // Process 8KB at a time
  let binary = '';
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for internal operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Since this is called internally by process-material, we don't need user auth
    // The calling function already verified the user
    const { filePath, fileType } = await req.json();

    if (!filePath || !fileType) {
      console.error('Missing required parameters:', { filePath, fileType });
      return new Response(JSON.stringify({ 
        error: 'File path and type are required',
        details: 'Both filePath and fileType must be provided'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY');
    if (!apiKey) {
      console.error('Google Cloud Vision API key not configured');
      return new Response(JSON.stringify({ 
        error: 'Google Cloud Vision API key not configured',
        details: 'GOOGLE_CLOUD_VISION_API_KEY environment variable is missing'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing file with Google Vision:', { filePath, fileType });

    // Download file from Supabase storage using service role
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('cramintel-materials')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error('Failed to download file:', downloadError);
      return new Response(JSON.stringify({ 
        error: 'Failed to download file',
        details: downloadError?.message || 'File not found'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const fileSize = fileData.size;
    console.log('File downloaded successfully. Size:', fileSize, 'bytes');

    // Check file size limits upfront
    if (fileSize > 20 * 1024 * 1024) { // 20MB limit
      console.error('File too large:', fileSize);
      return new Response(JSON.stringify({ 
        error: 'File too large',
        details: `File size ${Math.round(fileSize / 1024 / 1024)}MB exceeds 20MB limit`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let visionResponse: VisionResponse;

    if (fileType.includes('image')) {
      console.log('Processing as image file');
      visionResponse = await processImageSync(fileData, apiKey);
    } else if (fileType.includes('pdf')) {
      console.log('Processing as PDF file');
      visionResponse = await processPdfSync(fileData, apiKey, fileSize);
    } else {
      console.error('Unsupported file type:', fileType);
      return new Response(JSON.stringify({ 
        error: 'Unsupported file type',
        details: `File type ${fileType} is not supported. Only images and PDFs are supported.`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Vision processing completed successfully:', {
      method: visionResponse.method,
      confidence: visionResponse.confidence,
      textLength: visionResponse.text.length
    });

    return new Response(JSON.stringify({
      success: true,
      ...visionResponse
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in google-vision-service:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error occurred',
      details: 'Google Vision processing failed',
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processImageSync(fileData: Blob, apiKey: string): Promise<VisionResponse> {
  console.log('Processing image with Google Vision sync API');
  
  // Convert to base64 using chunk-based approach
  const arrayBuffer = await fileData.arrayBuffer();
  const base64Content = arrayBufferToBase64(arrayBuffer);
  
  // Check size limit (10MB for JSON payload, accounting for 37% base64 overhead)
  const estimatedJsonSize = base64Content.length * 1.37;
  console.log('Estimated JSON size:', Math.round(estimatedJsonSize / 1024 / 1024), 'MB');
  
  if (estimatedJsonSize > 10 * 1024 * 1024) {
    throw new Error('File too large for synchronous processing (>10MB estimated JSON size)');
  }

  const visionRequest = {
    requests: [{
      image: {
        content: base64Content
      },
      features: [{
        type: 'DOCUMENT_TEXT_DETECTION',
        maxResults: 1
      }]
    }]
  };

  console.log('Sending request to Google Vision API...');
  const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(visionRequest)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Vision API error response:', {
      status: response.status,
      statusText: response.statusText,
      errorText
    });
    throw new Error(`Vision API failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('Vision API response received');
  
  const annotation = result.responses[0];

  if (annotation.error) {
    console.error('Vision API annotation error:', annotation.error);
    throw new Error(`Vision API error: ${annotation.error.message}`);
  }

  const fullTextAnnotation = annotation.fullTextAnnotation;
  if (!fullTextAnnotation || !fullTextAnnotation.text) {
    console.log('No text detected in image');
    return {
      text: '',
      confidence: 0,
      method: 'google-vision-sync',
      metadata: { message: 'No text detected in image' }
    };
  }

  // Calculate average confidence from all detected text blocks
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
  console.log('Text extraction successful:', {
    textLength: fullTextAnnotation.text.length,
    blockCount,
    averageConfidence
  });

  return {
    text: fullTextAnnotation.text,
    confidence: Math.max(averageConfidence, 75), // Minimum 75% for successful detection
    method: 'google-vision-sync',
    boundingBoxes: annotation.textAnnotations,
    metadata: {
      detectedLanguages: fullTextAnnotation.pages?.[0]?.property?.detectedLanguages,
      blockCount
    }
  };
}

async function processPdfSync(fileData: Blob, apiKey: string, fileSize: number): Promise<VisionResponse> {
  console.log('Processing PDF with Google Vision sync API');
  
  // For smaller PDFs, try to process as base64
  if (fileSize > 8 * 1024 * 1024) { // 8MB limit to account for base64 overhead
    throw new Error('PDF too large for synchronous processing (>8MB). Please use a smaller PDF file.');
  }

  const arrayBuffer = await fileData.arrayBuffer();
  const base64Content = arrayBufferToBase64(arrayBuffer);

  console.log('PDF converted to base64, sending to Vision API...');

  const visionRequest = {
    requests: [{
      image: {
        content: base64Content
      },
      features: [{
        type: 'DOCUMENT_TEXT_DETECTION',
        maxResults: 1
      }]
    }]
  };

  const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(visionRequest)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Vision API error for PDF:', {
      status: response.status,
      statusText: response.statusText,
      errorText
    });
    throw new Error(`Vision API failed for PDF: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const annotation = result.responses[0];

  if (annotation.error) {
    console.error('Vision API PDF annotation error:', annotation.error);
    throw new Error(`Vision API error for PDF: ${annotation.error.message}`);
  }

  const fullTextAnnotation = annotation.fullTextAnnotation;
  if (!fullTextAnnotation || !fullTextAnnotation.text) {
    console.log('No text detected in PDF');
    return {
      text: '',
      confidence: 0,
      method: 'google-vision-pdf-sync',
      metadata: { message: 'No text detected in PDF' }
    };
  }

  // Calculate confidence for PDF processing
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

  const averageConfidence = blockCount > 0 ? Math.round((totalConfidence / blockCount) * 100) : 85;
  console.log('PDF text extraction successful:', {
    textLength: fullTextAnnotation.text.length,
    blockCount,
    averageConfidence
  });

  return {
    text: fullTextAnnotation.text,
    confidence: Math.max(averageConfidence, 80), // Higher minimum for PDF processing
    method: 'google-vision-pdf-sync',
    boundingBoxes: annotation.textAnnotations,
    metadata: {
      detectedLanguages: fullTextAnnotation.pages?.[0]?.property?.detectedLanguages,
      blockCount,
      pdfSize: fileSize
    }
  };
}
