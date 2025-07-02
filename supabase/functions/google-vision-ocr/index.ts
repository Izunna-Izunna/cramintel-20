
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    console.log('Starting PDF OCR processing...');
    console.log('Request method:', req.method);
    console.log('Content-Type:', req.headers.get('content-type'));
    
    let file: File;
    
    // Check if the request is multipart/form-data
    const contentType = req.headers.get('content-type') || '';
    console.log('Full content type:', contentType);
    
    if (contentType.includes('multipart/form-data')) {
      console.log('Processing as form data...');
      try {
        const formData = await req.formData();
        file = formData.get('file') as File;
        console.log('FormData processed successfully');
      } catch (formDataError) {
        console.error('FormData processing failed:', formDataError);
        throw new Error(`Failed to process form data: ${formDataError.message}`);
      }
    } else if (contentType.includes('application/json')) {
      console.log('Processing as JSON...');
      try {
        const body = await req.json();
        console.log('JSON body received:', Object.keys(body));
        
        // Handle base64 encoded file from JSON
        if (body.file && body.fileName && body.fileType) {
          const base64Data = body.file.split(',')[1] || body.file; // Remove data:mime;base64, prefix if present
          const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          file = new File([binaryData], body.fileName, { type: body.fileType });
          console.log('JSON file processed successfully');
        } else {
          throw new Error('Invalid JSON format. Expected {file, fileName, fileType}');
        }
      } catch (jsonError) {
        console.error('JSON processing failed:', jsonError);
        throw new Error(`Failed to process JSON: ${jsonError.message}`);
      }
    } else {
      // Try to read as text to see what we're actually getting
      try {
        const text = await req.text();
        console.log('Raw request body (first 500 chars):', text.substring(0, 500));
        throw new Error(`Unsupported content type: ${contentType}. Expected multipart/form-data or application/json. Raw body: ${text.substring(0, 100)}...`);
      } catch (textError) {
        throw new Error(`Unsupported content type: ${contentType}. Expected multipart/form-data or application/json. Could not read body: ${textError.message}`);
      }
    }
    
    if (!file) {
      throw new Error('No file provided');
    }

    console.log(`Processing file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Unsupported file type: ${file.type}. Supported types: PDF, JPEG, PNG, GIF, WebP`);
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

    // Process with Google Vision API using simplified approach
    const extractedText = await processWithGoogleVision(base64Content, file.type, apiKey);
    
    console.log('Successfully extracted text, length:', extractedText.length);

    return new Response(
      JSON.stringify({
        success: true,
        extractedText: extractedText, // Single text string for frontend compatibility
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

async function processWithGoogleVision(
  base64Content: string, 
  mimeType: string, 
  apiKey: string
): Promise<string> {
  try {
    console.log('Sending request to Google Vision API...');
    
    const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
    
    // Use the same request structure for all file types (PDFs and images)
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
      console.error('Google Vision API error response:', errorText);
      throw new Error(`Google Vision API error: ${response.status} - ${errorText}`);
    }

    const result: VisionAPIResponse = await response.json();
    console.log('Google Vision API response received');

    if (!result.responses || result.responses.length === 0) {
      throw new Error('No responses from Google Vision API');
    }

    const response_data = result.responses[0];
    
    if (response_data.error) {
      console.error('Error in Google Vision response:', response_data.error);
      throw new Error(`Google Vision API error: ${response_data.error.message}`);
    }

    if (response_data.fullTextAnnotation?.text) {
      console.log(`Extracted text length: ${response_data.fullTextAnnotation.text.length}`);
      return response_data.fullTextAnnotation.text;
    } else {
      console.log('No text detected in the document');
      return 'No text detected';
    }

  } catch (error) {
    console.error('Error in processWithGoogleVision:', error);
    throw new Error(`Google Vision processing failed: ${error.message}`);
  }
}
