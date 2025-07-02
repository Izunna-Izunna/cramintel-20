
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

    console.log(`Processing file: ${filePath}`);

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

    // Convert file to array buffer for processing
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Content = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    // Determine file type
    const isImage = filePath.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|bmp)$/);
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

    console.log(`File type detected - Image: ${!!isImage}, PDF: ${!!isPdf}`);

    // Process with Google Vision API
    const result = await processWithGoogleVision(base64Content, apiKey, isPdf);

    // Clean up: delete the uploaded file from storage
    await supabase.storage
      .from('cramintel-materials')
      .remove([filePath]);

    console.log('Processing completed successfully');

    return new Response(
      JSON.stringify({
        extractedText: result.text,
        confidence: result.confidence,
        fileType: isPdf ? 'pdf' : 'image',
        processingMethod: 'google-vision-api'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in google-vision-ocr function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        stack: error.stack 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function processWithGoogleVision(base64Content: string, apiKey: string, isPdf: boolean): Promise<{text: string, confidence?: number}> {
  try {
    console.log(`Processing with Google Vision API - Content size: ${base64Content.length} chars, PDF: ${isPdf}`);
    
    // Choose the appropriate feature type based on file type
    const featureType = isPdf ? 'DOCUMENT_TEXT_DETECTION' : 'TEXT_DETECTION';
    
    const visionRequest = {
      requests: [{
        image: {
          content: base64Content
        },
        features: [{
          type: featureType,
          maxResults: 1
        }]
      }]
    };

    console.log('Sending request to Google Vision API...');
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vision API HTTP Error:', response.status, errorText);
      throw new Error(`Vision API error: ${response.status} - ${errorText}`);
    }

    const visionResponse = await response.json();
    console.log('Vision API response received');
    
    // Check for API errors
    if (visionResponse.responses?.[0]?.error) {
      console.error('Vision API error:', visionResponse.responses[0].error);
      throw new Error(`Vision API error: ${visionResponse.responses[0].error.message}`);
    }

    let extractedText = '';
    let confidence = 0;

    const responseData = visionResponse.responses?.[0];
    
    if (responseData?.fullTextAnnotation) {
      // Use fullTextAnnotation for better text extraction (especially for PDFs)
      extractedText = responseData.fullTextAnnotation.text || '';
      
      // Calculate confidence from pages if available
      const pages = responseData.fullTextAnnotation.pages || [];
      if (pages.length > 0) {
        const confidenceSum = pages.reduce((sum: number, page: any) => {
          const pageConfidence = page.blocks?.reduce((blockSum: number, block: any) => 
            blockSum + (block.confidence || 0), 0) || 0;
          return sum + (pageConfidence / (page.blocks?.length || 1));
        }, 0);
        confidence = confidenceSum / pages.length;
      }
    } else if (responseData?.textAnnotations?.[0]) {
      // Fallback to textAnnotations
      extractedText = responseData.textAnnotations[0].description || '';
      
      // Calculate average confidence from all detected text
      const annotations = responseData.textAnnotations;
      if (annotations.length > 1) {
        const confidenceSum = annotations.slice(1).reduce((sum: number, annotation: any) => 
          sum + (annotation.confidence || 0), 0);
        confidence = confidenceSum / (annotations.length - 1);
      }
    }

    console.log(`Extracted ${extractedText.length} characters with confidence: ${confidence}`);
    
    return {
      text: extractedText,
      confidence: confidence > 0 ? confidence : undefined
    };
    
  } catch (error) {
    console.error('Error processing with Vision API:', error);
    throw error;
  }
}
