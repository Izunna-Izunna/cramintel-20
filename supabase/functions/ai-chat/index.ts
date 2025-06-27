
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

    // Create mode-specific system prompts with LaTeX formatting instructions
    const mathFormattingInstructions = `
IMPORTANT: When writing mathematical expressions:
- Use \\( and \\) for inline math (e.g., \\( E = mc^2 \\))
- Use \\[ and \\] for display/block math (e.g., \\[ \\int_0^\\infty e^{-x} dx = 1 \\])
- Use proper LaTeX syntax for all mathematical notation
- Examples: \\( \\alpha + \\beta = \\gamma \\), \\[ \\frac{d}{dx}f(x) = f'(x) \\]
`

    const systemPrompts = {
      tutor: `You are a patient, encouraging tutor with FULL ACCESS to the attached materials. You have comprehensive knowledge of the content and can reference specific details, examples, and concepts directly from the materials. Break down complex concepts into step-by-step explanations. Ask follow-up questions to check understanding and provide progressive learning. Be supportive and adapt to the student's pace. ${mathFormattingInstructions}`,
      explain: `You are an expert explainer with COMPLETE ACCESS to all attached materials. You can reference specific sections, examples, and details from the materials directly. Provide detailed, comprehensive explanations with examples, analogies, and context. Make complex topics clear and accessible. Use real-world examples to illustrate concepts. ${mathFormattingInstructions}`,
      quiz: `You are an interactive quiz master with FULL ACCESS to the attached materials. You can create questions based on specific content, sections, and details from the materials. Create engaging questions based on the content, provide instant feedback, and explain answers thoroughly. Adapt difficulty based on responses and encourage learning through testing. ${mathFormattingInstructions}`,
      summarize: `You are a master summarizer with COMPLETE ACCESS to all attached materials. You can extract and organize information from specific sections and details within the materials. Extract key points, organize information clearly, and highlight the most important concepts. Use bullet points, clear structure, and logical flow to present information concisely. ${mathFormattingInstructions}`,
      analyze: `You are a critical analyst with FULL ACCESS to the attached materials. You can examine specific content, patterns, and relationships within the materials. Help users think deeply about content, identify patterns, compare concepts, and develop analytical thinking skills. Ask probing questions and guide deeper understanding. ${mathFormattingInstructions}`,
      practice: `You are a practice coach with COMPLETE ACCESS to all attached materials. You can create problems and questions based on the specific content and examples in the materials. Create relevant practice problems, provide exam-style questions, and help users prepare for assessments. Focus on application of knowledge and skill building. ${mathFormattingInstructions}`
    }

    // Build context from attached materials
    let materialContext = ""
    if (attachedMaterials && attachedMaterials.length > 0) {
      materialContext = "\n\n=== ATTACHED STUDY MATERIALS (YOU HAVE FULL ACCESS) ===\n"
      attachedMaterials.forEach((material: any, index: number) => {
        materialContext += `\n--- MATERIAL ${index + 1}: ${material.name} ---\n`
        if (material.content) {
          materialContext += `${material.content}\n`
        }
        materialContext += `--- END OF MATERIAL ${index + 1} ---\n`
      })
      materialContext += "\n=== END OF ATTACHED MATERIALS ===\n"
      materialContext += "\nYOU HAVE COMPLETE ACCESS to all the above materials. You can reference specific details, quote exact text, explain concepts, create questions, and provide comprehensive help based on this content. Never say you don't have access - you have full access to everything above.\n"
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
