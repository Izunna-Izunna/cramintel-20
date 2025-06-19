
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create bucket if it doesn't exist
    const { data: buckets } = await supabase.storage.listBuckets()
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'cramintel-materials')
    
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket('cramintel-materials', {
        public: true,
        allowedMimeTypes: ['application/pdf', 'image/*'],
        fileSizeLimit: 50 * 1024 * 1024 // 50MB
      })
      
      if (error) {
        console.error('Failed to create bucket:', error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
      }
    }

    return new Response(JSON.stringify({ success: true, message: 'Storage bucket ready' }))
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
