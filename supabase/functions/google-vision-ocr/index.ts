
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApiResponse {
  success: boolean;
  extractedText?: string;
  error?: string;
  details?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Google Vision OCR function called');

  try {
    const apiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY');
    if (!apiKey) {
      console.error('Google Cloud Vision API key not found');
      return new Response(JSON.stringify({
        success: false,
        error: 'Google Cloud Vision API key not configured'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('API key found, processing request');
    let fileBuffer: ArrayBuffer;
    let fileName: string;
    let fileType: string;

    // Check content type to determine how to process the request
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      console.log('Processing FormData request');
      const formData = await req.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return new Response(JSON.stringify({
          success: false,
          error: 'No file provided in FormData'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      fileBuffer = await file.arrayBuffer();
      fileName = file.name;
      fileType = file.type;
    } else {
      console.log('Processing JSON request');
      const jsonData = await req.json();
      
      if (!jsonData.file) {
        return new Response(JSON.stringify({
          success: false,
          error: 'No file data provided in JSON'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Handle base64 data
      const base64Data = jsonData.file.split(',')[1] || jsonData.file;
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      fileBuffer = bytes.buffer;
      fileName = jsonData.fileName || 'uploaded-file';
      fileType = jsonData.fileType || 'application/octet-stream';
    }

    console.log(`Processing file: ${fileName}, type: ${fileType}, size: ${fileBuffer.byteLength}`);

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf'
    ];
    
    if (!allowedTypes.includes(fileType)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Unsupported file type: ${fileType}`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Convert file to base64 for Google Vision API
    const base64Content = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
    
    console.log('Calling Google Vision API');
    
    // Call Google Vision API
    const visionResponse = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          image: {
            content: base64Content
          },
          features: [{
            type: 'DOCUMENT_TEXT_DETECTION',
            maxResults: 1
          }]
        }]
      })
    });

    console.log('Google Vision API response status:', visionResponse.status);

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error('Google Vision API error:', errorText);
      return new Response(JSON.stringify({
        success: false,
        error: 'Google Vision API request failed',
        details: errorText
      }), {
        status: visionResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const visionData = await visionResponse.json();
    console.log('Google Vision API response received');

    // Extract text from response
    let extractedText = '';
    if (visionData.responses && visionData.responses[0]) {
      const response = visionData.responses[0];
      if (response.fullTextAnnotation) {
        extractedText = response.fullTextAnnotation.text || '';
      } else if (response.textAnnotations && response.textAnnotations.length > 0) {
        extractedText = response.textAnnotations[0].description || '';
      }
    }

    console.log(`Extracted text length: ${extractedText.length}`);

    return new Response(JSON.stringify({
      success: true,
      extractedText: extractedText
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in Google Vision OCR function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
