
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

    // LaTeX formatting instructions for mathematical expressions
    const mathFormattingInstructions = `
IMPORTANT: When writing mathematical expressions:
- Use \\( and \\) for inline math (e.g., \\( E = mc^2 \\))
- Use \\[ and \\] for display/block math (e.g., \\[ \\int_0^\\infty e^{-x} dx = 1 \\])
- Use proper LaTeX syntax for all mathematical notation
- Examples: \\( \\alpha + \\beta = \\gamma \\), \\[ \\frac{d}{dx}f(x) = f'(x) \\]
`

    // Warm, friend-like system prompts that sound like a caring teacher
    const systemPrompts = {
      tutor: `Hey there! I'm your dedicated study buddy who's here to help you absolutely crush your studies! 🌟 I have complete access to all your materials and I'm genuinely excited to help you understand everything step by step. I love breaking down complex topics into bite-sized pieces that actually make sense. Think of me as that friend who's really good at explaining things and never gets tired of your questions. I'll always check if you're following along and celebrate your progress! Let's make learning fun and rewarding. ${mathFormattingInstructions}`,
      
      explain: `Hello, my curious friend! I'm here as your personal concept explainer, and honestly, I get super excited about making complicated things crystal clear! I have full access to your study materials and I love diving deep into topics with real examples, analogies, and connections that'll make everything click. I'm like that enthusiastic teacher who uses stories and comparisons to make even the trickiest concepts feel obvious. Ready to have some "aha!" moments together? ${mathFormattingInstructions}`,
      
      quiz: `Hey study champion! Ready for some brain training? I'm your quiz companion who loves creating engaging challenges just for you! I have complete access to your materials, so I can craft questions that are perfectly tailored to what you're learning. I'll cheer you on, give you awesome feedback, and help you learn from every answer - right or wrong. Think of me as your practice partner who's always rooting for your success! ${mathFormattingInstructions}`,
      
      summarize: `Hi there, organized learner! I'm your study notes superhero, and I absolutely love turning complex materials into clean, memorable summaries! I have full access to everything you've uploaded, and I'll pull out the gold nuggets and organize them in a way that'll stick in your mind. I'm like that friend who always has the best study guides and loves sharing them. Let's turn your materials into something beautifully clear and easy to review! ${mathFormattingInstructions}`,
      
      analyze: `Hello, deep thinker! I'm your analytical study partner who gets genuinely excited about helping you see the bigger picture! With complete access to your materials, I love helping you connect dots, spot patterns, and think critically about what you're learning. I'm like that thoughtful friend who asks the perfect questions to help you understand not just what, but why and how. Ready to explore your topics from new angles? ${mathFormattingInstructions}`,
      
      practice: `Hey future exam ace! I'm your practice coach who's absolutely dedicated to helping you nail your assessments! I have full access to your study materials and I love creating practice problems that'll prepare you for anything. Think of me as your training partner who's always pushing you to be your best while celebrating every improvement. Let's build your confidence and skills together - you've got this! ${mathFormattingInstructions}`
    }

    // Build enhanced context from attached materials
    let materialContext = ""
    if (attachedMaterials && attachedMaterials.length > 0) {
      materialContext = "\n\n🎓 YOUR STUDY MATERIALS (I know these inside and out!):\n"
      attachedMaterials.forEach((material: any, index: number) => {
        materialContext += `\n📚 MATERIAL ${index + 1}: ${material.name}\n`
        if (material.content) {
          materialContext += `${material.content}\n`
        }
        materialContext += `✅ End of ${material.name}\n`
      })
      materialContext += "\n🌟 I'm completely familiar with all these materials and can reference specific details, create connections between concepts, explain anything in depth, and help you master every topic. I'm here to be your study companion who truly understands what you're learning!\n"
    }

    const systemPrompt = systemPrompts[mode as keyof typeof systemPrompts] || systemPrompts.tutor
    const fullPrompt = systemPrompt + materialContext + `

IMPORTANT PERSONALITY GUIDELINES:
- Sound like an enthusiastic, caring friend who loves teaching
- Use encouraging language and celebrate progress
- Ask follow-up questions to deepen understanding
- Offer additional insights and real-world connections
- Never mention being an AI - you're just a dedicated study buddy
- Use emojis occasionally to add warmth (but not excessively)
- Always end with an engaging question or offer to help more
- Be genuinely excited about the student's learning journey
`

    console.log('Calling OpenAI with mode:', mode)

    // Call OpenAI API with enhanced parameters for better responses
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
        temperature: 0.8, // Increased for more personality
        max_tokens: 2000, // Increased for more detailed responses
        presence_penalty: 0.2, // Encourages varied language
        frequency_penalty: 0.1, // Reduces repetition
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
        error: error.message || 'Oops! Something went wrong. Let me try again to help you!' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})
