
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TextractResponse {
  text: string;
  confidence: number;
  method: 'textract-sync' | 'textract-async-s3' | 'fallback';
  metadata?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath, materialId, fileType } = await req.json();

    if (!filePath || !materialId) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting Textract extraction via Lambda for material:', materialId, 'File type:', fileType);

    // Get Lambda function URL from environment
    const lambdaUrl = Deno.env.get('TEXTRACT_LAMBDA_URL');
    if (!lambdaUrl) {
      throw new Error('TEXTRACT_LAMBDA_URL not configured');
    }

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('cramintel-materials')
      .download(filePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    const fileBuffer = await fileData.arrayBuffer();
    const fileSize = fileBuffer.byteLength;
    
    console.log('File downloaded, size:', fileSize, 'bytes');

    // Convert to base64 for Lambda transport
    const base64Buffer = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
    
    // Call Lambda function
    console.log('Calling Lambda function for Textract processing...');
    const lambdaResponse = await fetch(lambdaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileBuffer: base64Buffer,
        fileName: filePath.split('/').pop(),
        fileType: fileType
      })
    });

    if (!lambdaResponse.ok) {
      const errorText = await lambdaResponse.text();
      console.error('Lambda response error:', errorText);
      throw new Error(`Lambda function failed: ${lambdaResponse.status} - ${errorText}`);
    }

    const lambdaResult = await lambdaResponse.json();
    
    if (!lambdaResult.success) {
      throw new Error(`Lambda processing failed: ${lambdaResult.error}`);
    }

    console.log('Lambda processing successful:', {
      method: lambdaResult.method,
      confidence: lambdaResult.confidence,
      textLength: lambdaResult.extractedText?.length || 0
    });

    // Update material with extraction results
    await supabase
      .from('cramintel_materials')
      .update({
        extraction_method: lambdaResult.method,
        extraction_confidence: lambdaResult.confidence,
        extraction_metadata: lambdaResult.metadata || {}
      })
      .eq('id', materialId);

    return new Response(JSON.stringify({
      success: true,
      extractedText: lambdaResult.extractedText,
      confidence: lambdaResult.confidence,
      method: lambdaResult.method,
      fileSize
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in textract-service:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
