
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
    console.log('Request method:', req.method)
    console.log('Content-Type:', req.headers.get('content-type'))
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse FormData instead of JSON
    const formData = await req.formData()
    
    // Extract data from FormData
    const file = formData.get('file') as File
    const fileName = formData.get('fileName') as string
    const course = formData.get('course') as string || 'General'
    const materialType = formData.get('materialType') as string || 'document'
    const groupId = formData.get('groupId') as string || null
    const groupName = formData.get('groupName') as string || null
    
    // Get user ID from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing authorization header'
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401
        }
      )
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid or expired token'
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401
        }
      )
    }

    const userId = user.id

    console.log('📝 Upload request received:', { 
      fileName, 
      userId, 
      materialType, 
      course,
      fileSize: file?.size || 0,
      groupId,
      groupName
    })

    // Validate required fields
    if (!file || !fileName) {
      console.error('❌ Missing required fields:', { 
        hasFile: !!file, 
        hasFileName: !!fileName
      })
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: file and fileName are required'
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      )
    }

    // Step 1: Upload file to storage
    console.log('📤 Starting file upload to storage...')
    
    // Convert File to Uint8Array
    const fileBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(fileBuffer)

    const timestamp = Date.now()
    const filePath = `${userId}/${timestamp}_${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('cramintel-materials')
      .upload(filePath, uint8Array, {
        contentType: file.type || (fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/*'),
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
        file_type: file.type || (fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/*'),
        file_size: uint8Array.length,
        user_id: userId,
        material_type: materialType,
        course: course,
        group_id: groupId,
        group_name: groupName,
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

    // Step 3: Trigger processing (this can fail without affecting upload success)
    console.log('⚙️ Starting material processing...')
    let processingSuccess = false
    let processingError = null

    try {
      // Call the process-material function
      const processResponse = await supabase.functions.invoke('process-material', {
        body: {
          materialId: materialId,
          userId: userId,
          filePath: uploadData.path,
          fileName: fileName
        }
      })

      if (processResponse.error) {
        console.warn('⚠️ Material processing failed:', processResponse.error)
        processingError = processResponse.error.message
      } else {
        console.log('✅ Material processing triggered successfully')
        processingSuccess = true
      }
    } catch (error) {
      console.warn('⚠️ Material processing error:', error)
      processingError = error.message
    }

    // Update material processing status
    const finalStatus = processingSuccess ? 'extracting_text' : 'error'
    await supabase
      .from('cramintel_materials')
      .update({
        processing_status: finalStatus,
        processing_progress: processingSuccess ? 10 : 0
      })
      .eq('id', materialId)

    console.log('🎉 Upload completed successfully')

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        material: materialData,
        processingTriggered: processingSuccess,
        message: 'Material uploaded successfully',
        ...(processingError && { processingError: processingError }),
        uploadPath: uploadData.path,
        fileSize: uint8Array.length
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
