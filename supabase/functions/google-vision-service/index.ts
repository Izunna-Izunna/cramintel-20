
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { filePath, fileType } = await req.json();

    if (!filePath || !fileType) {
      return new Response(JSON.stringify({ error: 'File path and type are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Google Cloud Vision API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing file with Google Vision:', filePath, fileType);

    // Download file from Supabase storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('cramintel-materials')
      .download(filePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    const fileSize = fileData.size;
    console.log('File size:', fileSize, 'bytes');

    let visionResponse: VisionResponse;

    if (fileType.includes('image')) {
      // Process images synchronously
      visionResponse = await processImageSync(fileData, apiKey);
    } else if (fileType.includes('pdf')) {
      // For PDFs, we'll use a simpler approach - convert to base64 and try sync processing
      // This works for smaller PDFs within the 10MB request limit
      visionResponse = await processPdfSync(fileData, apiKey, fileSize);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    console.log('Vision processing completed:', visionResponse.method, visionResponse.confidence);

    return new Response(JSON.stringify({
      success: true,
      ...visionResponse
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in google-vision-service:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Google Vision processing failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processImageSync(fileData: Blob, apiKey: string): Promise<VisionResponse> {
  console.log('Processing image with Google Vision sync API');
  
  // Convert to base64
  const arrayBuffer = await fileData.arrayBuffer();
  const base64Content = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  
  // Check size limit (10MB for JSON payload, accounting for 37% base64 overhead)
  const estimatedJsonSize = base64Content.length * 1.37;
  if (estimatedJsonSize > 10 * 1024 * 1024) {
    throw new Error('File too large for synchronous processing');
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

  const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(visionRequest)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Vision API error:', errorText);
    throw new Error(`Vision API failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const annotation = result.responses[0];

  if (annotation.error) {
    throw new Error(`Vision API error: ${annotation.error.message}`);
  }

  const fullTextAnnotation = annotation.fullTextAnnotation;
  if (!fullTextAnnotation || !fullTextAnnotation.text) {
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
  console.log('Processing PDF with Google Vision sync API (experimental)');
  
  // For smaller PDFs, try to process as base64
  if (fileSize > 8 * 1024 * 1024) { // 8MB limit to account for base64 overhead
    throw new Error('PDF too large for synchronous processing. Consider implementing async GCS processing.');
  }

  const arrayBuffer = await fileData.arrayBuffer();
  const base64Content = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

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
    console.error('Vision API error for PDF:', errorText);
    throw new Error(`Vision API failed for PDF: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const annotation = result.responses[0];

  if (annotation.error) {
    throw new Error(`Vision API error for PDF: ${annotation.error.message}`);
  }

  const fullTextAnnotation = annotation.fullTextAnnotation;
  if (!fullTextAnnotation || !fullTextAnnotation.text) {
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
