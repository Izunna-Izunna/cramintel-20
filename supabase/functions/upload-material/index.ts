
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Set the auth context
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing upload for user:', user.id);

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    const course = formData.get('course') as string;
    const materialType = formData.get('materialType') as string;
    const groupId = formData.get('groupId') as string; // For grouped uploads
    const groupName = formData.get('groupName') as string; // For grouped uploads

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', materialType);

    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${user.id}/${course}/${uniqueFileName}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('cramintel-materials')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(JSON.stringify({ error: 'Failed to upload file' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('File uploaded successfully:', uploadData.path);

    // Determine processing approach based on material type
    const isPastQuestionImages = materialType === 'past-question-images';
    const requiresOCR = isPastQuestionImages && file.type.startsWith('image/');

    // Prepare material data
    const materialData = {
      user_id: user.id,
      name: fileName || file.name.replace(/\.[^/.]+$/, ''),
      file_name: file.name,
      file_path: uploadData.path,
      file_type: file.type,
      file_size: file.size,
      course: course,
      material_type: materialType,
      processed: false,
      processing_status: requiresOCR ? 'pending_ocr' : 'pending',
      processing_progress: 0,
      tags: isPastQuestionImages ? ['past-questions', 'ocr-processed'] : [],
      group_id: groupId || null,
      group_name: groupName || null
    };

    // Save material metadata to database
    const { data: savedMaterial, error: dbError } = await supabase
      .from('cramintel_materials')
      .insert(materialData)
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('cramintel-materials').remove([uploadData.path]);
      
      return new Response(JSON.stringify({ error: 'Failed to save material metadata' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Material saved to database:', savedMaterial.id, 'Requires OCR:', requiresOCR);

    // Immediately trigger background processing with proper error handling
    let processingTriggered = false;
    try {
      console.log('Triggering background processing for material:', savedMaterial.id);
      
      const { data: processResult, error: processError } = await supabase.functions.invoke('process-material', {
        body: { materialId: savedMaterial.id },
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      if (processError) {
        console.error('Failed to trigger processing:', processError);
        throw processError;
      }

      console.log('Background processing triggered successfully:', processResult);
      processingTriggered = true;
      
    } catch (processError) {
      console.error('Failed to trigger background processing:', processError);
      
      // Update material status to indicate processing failed to start
      await supabase
        .from('cramintel_materials')
        .update({ 
          processing_status: 'error',
          processing_progress: 0 
        })
        .eq('id', savedMaterial.id);
        
      return new Response(JSON.stringify({
        error: 'Material uploaded but processing failed to start',
        material: savedMaterial,
        processingError: processError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      material: savedMaterial,
      processingTriggered,
      requiresOCR,
      message: isPastQuestionImages 
        ? 'Past question image uploaded successfully and OCR processing started'
        : 'Material uploaded successfully and processing started'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in upload-material function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
