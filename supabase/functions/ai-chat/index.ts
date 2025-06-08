
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
    
    console.log('AI Chat request:', { mode, materialsCount: attachedMaterials?.length || 0 })
    
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
      console.error('Unauthorized request - no user found')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('User authenticated:', user.id)

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.error('OpenAI API key not configured')
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured. Please contact an administrator.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Create mode-specific system prompts
    const systemPrompts = {
      tutor: "You are a patient, encouraging tutor. Break down complex concepts into step-by-step explanations. Ask follow-up questions to check understanding and provide progressive learning. Be supportive and adapt to the student's pace.",
      explain: "You are an expert explainer. Provide detailed, comprehensive explanations with examples, analogies, and context. Make complex topics clear and accessible. Use real-world examples to illustrate concepts.",
      quiz: "You are an interactive quiz master. Create engaging questions based on the content, provide instant feedback, and explain answers thoroughly. Adapt difficulty based on responses and encourage learning through testing.",
      summarize: "You are a master summarizer. Extract key points, organize information clearly, and highlight the most important concepts. Use bullet points, clear structure, and logical flow to present information concisely.",
      analyze: "You are a critical analyst. Help users think deeply about content, identify patterns, compare concepts, and develop analytical thinking skills. Ask probing questions and guide deeper understanding.",
      practice: "You are a practice coach. Create relevant practice problems, provide exam-style questions, and help users prepare for assessments. Focus on application of knowledge and skill building."
    }

    // Build context from attached materials
    let materialContext = ""
    if (attachedMaterials && attachedMaterials.length > 0) {
      materialContext = "\n\nContext from attached materials:\n"
      attachedMaterials.forEach((material: any, index: number) => {
        materialContext += `\n${index + 1}. ${material.name}`
        if (material.content) {
          // Limit content length to prevent token overflow
          const content = material.content.length > 2000 
            ? material.content.substring(0, 2000) + "..." 
            : material.content
          materialContext += `\nContent: ${content}\n`
        }
      })
      materialContext += "\nPlease use this context to provide more relevant and specific responses.\n"
    }

    const systemPrompt = systemPrompts[mode as keyof typeof systemPrompts] || systemPrompts.tutor
    const fullPrompt = systemPrompt + materialContext

    console.log('Calling OpenAI with mode:', mode)

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: fullPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API error:', openaiResponse.status, errorText)
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`)
    }

    const openaiData = await openaiResponse.json()
    const aiResponse = openaiData.choices[0].message.content

    console.log('Successfully generated AI response')

    return new Response(
      JSON.stringify({ response: aiResponse, mode }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in ai-chat function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred. Please try again.' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})
