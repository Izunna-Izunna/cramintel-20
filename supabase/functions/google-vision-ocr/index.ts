
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath } = await req.json();
    
    if (!filePath) {
      return new Response(
        JSON.stringify({ error: 'File path is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('cramintel-materials')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error('Error downloading file:', downloadError);
      return new Response(
        JSON.stringify({ error: 'Failed to download file from storage' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Convert file to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Content = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    // Determine file type
    const isImage = filePath.toLowerCase().match(/\.(jpg|jpeg|png)$/);
    const isPdf = filePath.toLowerCase().endsWith('.pdf');

    // Get Google Cloud Vision API key
    const apiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Google Cloud Vision API key not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let visionResponse;
    let extractedText = '';
    let confidence = 0;
    let pages = 1;

    if (isImage) {
      // Process image using TEXT_DETECTION
      const visionRequest = {
        requests: [{
          image: {
            content: base64Content
          },
          features: [{
            type: 'TEXT_DETECTION',
            maxResults: 1
          }]
        }]
      };

      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(visionRequest)
        }
      );

      visionResponse = await response.json();
      
      if (visionResponse.responses?.[0]?.textAnnotations?.[0]) {
        extractedText = visionResponse.responses[0].textAnnotations[0].description || '';
        // Calculate average confidence from all detected text
        const annotations = visionResponse.responses[0].textAnnotations;
        if (annotations.length > 1) {
          const confidenceSum = annotations.slice(1).reduce((sum: number, annotation: any) => 
            sum + (annotation.confidence || 0), 0);
          confidence = confidenceSum / (annotations.length - 1);
        }
      }
    } else if (isPdf) {
      // Process PDF using DOCUMENT_TEXT_DETECTION
      const visionRequest = {
        requests: [{
          image: {
            content: base64Content
          },
          features: [{
            type: 'DOCUMENT_TEXT_DETECTION'
          }]
        }]
      };

      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(visionRequest)
        }
      );

      visionResponse = await response.json();
      
      if (visionResponse.responses?.[0]?.fullTextAnnotation) {
        extractedText = visionResponse.responses[0].fullTextAnnotation.text || '';
        
        // Calculate confidence from pages
        const textPages = visionResponse.responses[0].fullTextAnnotation.pages || [];
        pages = textPages.length || 1;
        
        if (textPages.length > 0) {
          const confidenceSum = textPages.reduce((sum: number, page: any) => {
            const pageConfidence = page.blocks?.reduce((blockSum: number, block: any) => 
              blockSum + (block.confidence || 0), 0) || 0;
            return sum + (pageConfidence / (page.blocks?.length || 1));
          }, 0);
          confidence = confidenceSum / textPages.length;
        }
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported file type. Please upload JPEG, PNG, or PDF files.' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check for API errors
    if (visionResponse.responses?.[0]?.error) {
      console.error('Vision API error:', visionResponse.responses[0].error);
      return new Response(
        JSON.stringify({ error: `Vision API error: ${visionResponse.responses[0].error.message}` }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Clean up: delete the uploaded file from storage
    await supabase.storage
      .from('cramintel-materials')
      .remove([filePath]);

    return new Response(
      JSON.stringify({
        extractedText,
        confidence: confidence > 0 ? confidence : undefined,
        pages: isPdf ? pages : undefined,
        fileType: isImage ? 'image' : 'pdf'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in google-vision-ocr function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
