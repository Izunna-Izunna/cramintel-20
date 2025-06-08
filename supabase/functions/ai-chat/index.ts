
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, mode, attachedMaterials } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from auth header
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Create mode-specific system prompts
    const systemPrompts = {
      tutor: "You are a patient, encouraging tutor. Break down complex concepts into step-by-step explanations. Ask follow-up questions to check understanding and provide progressive learning.",
      explain: "You are an expert explainer. Provide detailed, comprehensive explanations with examples, analogies, and context. Make complex topics clear and accessible.",
      quiz: "You are an interactive quiz master. Create engaging questions, provide instant feedback, and explain answers thoroughly. Adapt difficulty based on responses.",
      summarize: "You are a master summarizer. Extract key points, organize information clearly, and highlight the most important concepts. Use bullet points and clear structure.",
      analyze: "You are a critical analyst. Help users think deeply about content, identify patterns, compare concepts, and develop analytical thinking skills.",
      practice: "You are a practice coach. Create relevant practice problems, provide exam-style questions, and help users prepare for assessments."
    }

    // Build context from attached materials
    let materialContext = ""
    if (attachedMaterials && attachedMaterials.length > 0) {
      materialContext = "\n\nAttached Materials Context:\n"
      attachedMaterials.forEach((material: any, index: number) => {
        materialContext += `${index + 1}. ${material.name}\n`
        if (material.content) {
          materialContext += `Content: ${material.content.substring(0, 1000)}...\n\n`
        }
      })
    }

    const systemPrompt = systemPrompts[mode as keyof typeof systemPrompts] || systemPrompts.tutor
    const fullPrompt = systemPrompt + materialContext

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: fullPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`)
    }

    const openaiData = await openaiResponse.json()
    const aiResponse = openaiData.choices[0].message.content

    return new Response(
      JSON.stringify({ response: aiResponse, mode }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in ai-chat function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})
