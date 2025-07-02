
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VisionAPIResponse {
  responses: Array<{
    fullTextAnnotation?: {
      text: string;
    };
    error?: {
      code: number;
      message: string;
    };
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting OCR processing...');
    console.log('Request method:', req.method);
    
    let file: File;
    const contentType = req.headers.get('content-type') || '';
    console.log('Content type:', contentType);
    
    // Handle different content types
    if (contentType.includes('multipart/form-data')) {
      console.log('Processing FormData...');
      const formData = await req.formData();
      file = formData.get('file') as File;
      
      if (!file) {
        throw new Error('No file found in FormData');
      }
    } else if (contentType.includes('application/json')) {
      console.log('Processing JSON...');
      const body = await req.json();
      
      if (!body.file || !body.fileName || !body.fileType) {
        throw new Error('Invalid JSON format. Expected {file, fileName, fileType}');
      }
      
      const base64Data = body.file.split(',')[1] || body.file;
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      file = new File([binaryData], body.fileName, { type: body.fileType });
    } else {
      throw new Error(`Unsupported content type: ${contentType}`);
    }
    
    console.log(`Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`);

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Unsupported file type: ${file.type}`);
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Content = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    console.log('File converted to base64, length:', base64Content.length);

    // Get Google Cloud API key
    const apiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY');
    if (!apiKey) {
      throw new Error('Google Cloud Vision API key not configured');
    }

    // Call Google Vision API - same approach for all file types
    console.log('Calling Google Vision API...');
    const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
    
    const requestBody = {
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

    const response = await fetch(visionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Vision API error:', errorText);
      throw new Error(`Google Vision API error: ${response.status} - ${errorText}`);
    }

    const result: VisionAPIResponse = await response.json();
    console.log('Google Vision API response received');

    if (!result.responses || result.responses.length === 0) {
      throw new Error('No responses from Google Vision API');
    }

    const responseData = result.responses[0];
    
    if (responseData.error) {
      console.error('Error in Google Vision response:', responseData.error);
      throw new Error(`Google Vision API error: ${responseData.error.message}`);
    }

    let extractedText = 'No text detected';
    if (responseData.fullTextAnnotation?.text) {
      extractedText = responseData.fullTextAnnotation.text;
      console.log(`Successfully extracted text, length: ${extractedText.length}`);
    } else {
      console.log('No text detected in the document');
    }

    return new Response(
      JSON.stringify({
        success: true,
        extractedText: extractedText,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          processedAt: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in google-vision-ocr function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
