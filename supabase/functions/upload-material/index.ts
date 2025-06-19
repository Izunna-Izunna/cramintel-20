
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Upload material function started')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const requestBody = await req.json()
    const { 
      file, 
      fileName, 
      userId, 
      materialType = 'document',
      course = 'General',
      tags = []
    } = requestBody

    console.log('📝 Upload request received:', { 
      fileName, 
      userId, 
      materialType, 
      course,
      fileSize: file?.length || 0 
    })

    // Validate required fields
    if (!file || !fileName || !userId) {
      console.error('❌ Missing required fields:', { 
        hasFile: !!file, 
        hasFileName: !!fileName, 
        hasUserId: !!userId 
      })
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: file, fileName, and userId are required'
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      )
    }

    // Step 1: Upload file to storage
    console.log('📤 Starting file upload to storage...')
    let fileBuffer: Uint8Array
    try {
      fileBuffer = Uint8Array.from(atob(file), c => c.charCodeAt(0))
    } catch (error) {
      console.error('❌ Failed to decode base64 file:', error)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid file format - unable to decode base64 data'
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      )
    }

    const timestamp = Date.now()
    const filePath = `${userId}/${timestamp}_${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('cramintel-materials')
      .upload(filePath, fileBuffer, {
        contentType: fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/*',
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Storage upload failed:', uploadError)
      return new Response(
        JSON.stringify({
          success: false,
          error: `File upload failed: ${uploadError.message}`,
          details: uploadError
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500
        }
      )
    }

    console.log('✅ File uploaded successfully:', uploadData.path)

    // Step 2: Create material record immediately (before processing)
    console.log('📝 Creating material record...')
    const { data: materialData, error: materialError } = await supabase
      .from('cramintel_materials')
      .insert({
        name: fileName,
        file_name: fileName,
        file_path: uploadData.path,
        file_type: fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/*',
        file_size: fileBuffer.length,
        user_id: userId,
        material_type: materialType,
        course: course,
        tags: tags,
        processed: false,
        processing_status: 'pending',
        upload_date: new Date().toISOString()
      })
      .select()
      .single()

    if (materialError) {
      console.error('❌ Material record creation failed:', materialError)
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('cramintel-materials').remove([uploadData.path])
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to create material record: ${materialError.message}`,
          details: materialError
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500
        }
      )
    }

    const materialId = materialData.id
    console.log('✅ Material record created:', materialId)

    // Step 3: Process the material (this can fail without affecting upload success)
    console.log('⚙️ Starting material processing...')
    let processingSuccess = false
    let processingError = null

    try {
      // Call the process-material function
      const processResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/process-material`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          materialId: materialId,
          userId: userId,
          filePath: uploadData.path,
          fileName: fileName
        })
      })

      if (processResponse.ok) {
        const processResult = await processResponse.json()
        console.log('✅ Material processing completed:', processResult)
        processingSuccess = true
      } else {
        const errorText = await processResponse.text()
        console.warn('⚠️ Material processing failed:', errorText)
        processingError = errorText
      }
    } catch (error) {
      console.warn('⚠️ Material processing error:', error)
      processingError = error.message
    }

    // Update material processing status
    const finalStatus = processingSuccess ? 'completed' : 'failed'
    await supabase
      .from('cramintel_materials')
      .update({
        processed: processingSuccess,
        processing_status: finalStatus,
        ...(processingError && { processing_progress: 0 })
      })
      .eq('id', materialId)

    console.log('🎉 Upload completed successfully')

    // Return success regardless of processing outcome
    return new Response(
      JSON.stringify({
        success: true,
        materialId: materialId,
        message: 'Material uploaded successfully',
        processingStatus: finalStatus,
        processingSuccess: processingSuccess,
        ...(processingError && { processingError: processingError }),
        uploadPath: uploadData.path,
        fileSize: fileBuffer.length
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Upload function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Upload failed due to server error',
        details: error.message,
        stack: error.stack
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    )
  }
})
