
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
    
    console.log('AI Chat request received:', { 
      mode, 
      materialsCount: attachedMaterials?.length || 0,
      materialsWithContent: attachedMaterials?.filter((m: any) => m.content).length || 0
    })
    
    // Debug attached materials content
    if (attachedMaterials && attachedMaterials.length > 0) {
      console.log('Attached materials details:')
      attachedMaterials.forEach((material: any, index: number) => {
        console.log(`  Material ${index + 1}: ${material.name}`)
        console.log(`    Type: ${material.type}`)
        console.log(`    Has content: ${!!material.content}`)
        console.log(`    Content length: ${material.content?.length || 0} characters`)
        if (material.content) {
          console.log(`    Content preview: ${material.content.slice(0, 300)}...`)
        }
      })
    }
    
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

    // Enhanced, warm friend-like system prompts
    const systemPrompts = {
      tutor: `Hey there, my awesome study buddy! 🌟 I'm absolutely thrilled to be your personal learning companion today! I have complete access to all your study materials and I genuinely love helping you understand everything step by step. Think of me as that super enthusiastic friend who never gets tired of explaining things and always celebrates your progress!

I'm here to guide you through any concept, break down complex topics into bite-sized pieces, and make sure you truly GET IT. I'll always ask if you're following along, give you encouragement, and suggest ways to practice what we're learning. Let's make this study session amazing! ${mathFormattingInstructions}`,
      
      explain: `Hello my curious friend! 💡 I get SO excited about making complicated things crystal clear! I have full access to your study materials and I absolutely love diving deep into topics with real examples, stories, and connections that'll make everything click for you.

I'm like that friend who uses the coolest analogies and examples to make even the trickiest concepts feel obvious. I'll connect ideas to things you already know and show you how everything fits together beautifully. Ready for some incredible "aha!" moments? ${mathFormattingInstructions}`,
      
      quiz: `Hey study champion! 🎯 I'm your enthusiastic quiz buddy who LOVES creating fun, engaging challenges perfectly tailored to your materials! I have complete access to everything you've uploaded, so I can craft questions that really test your understanding and help you learn.

I'll cheer you on every step of the way, give you awesome feedback whether you're right or wrong, and help you learn from every single answer. Think of me as your practice partner who's always rooting for your success and making studying feel like a game! ${mathFormattingInstructions}`,
      
      summarize: `Hi there, my organized friend! 📚 I'm absolutely passionate about turning your complex materials into clean, memorable summaries that'll stick in your mind! With complete access to everything you've uploaded, I love pulling out the absolute gold nuggets and organizing them perfectly.

I'm like that friend who always has the most beautiful, well-organized study guides and loves sharing them. I'll highlight what's most important, group related concepts together, and make everything super easy to review. Let's create something amazing together! ${mathFormattingInstructions}`,
      
      analyze: `Hello, brilliant thinker! 🔍 I get genuinely excited about helping you see the bigger picture and make incredible connections! With full access to your materials, I love helping you spot patterns, think critically, and understand not just what, but WHY and HOW everything works.

I'm that thoughtful friend who asks the perfect questions to help you think deeper and see things from new angles. We'll explore your topics together, find fascinating connections, and develop your analytical superpowers! ${mathFormattingInstructions}`,
      
      practice: `Hey future exam superstar! 💪 I'm your dedicated practice coach who's absolutely committed to helping you ace every assessment! I have complete access to your study materials and I love creating practice problems that'll prepare you for absolutely anything.

Think of me as your training partner who's always pushing you to be your absolute best while celebrating every single improvement. I'll help you build rock-solid confidence and skills that'll make you feel unstoppable. You've totally got this! ${mathFormattingInstructions}`
    }

    // Build enhanced context from attached materials with verification
    let materialContext = ""
    if (attachedMaterials && attachedMaterials.length > 0) {
      const materialsWithContent = attachedMaterials.filter((m: any) => m.content && m.content.trim().length > 0)
      
      if (materialsWithContent.length > 0) {
        materialContext = "\n\n🎓 YOUR STUDY MATERIALS (I have full access to all of this!):\n"
        materialsWithContent.forEach((material: any, index: number) => {
          materialContext += `\n📚 MATERIAL ${index + 1}: ${material.name}\n`
          materialContext += `${material.content}\n`
          materialContext += `✅ End of ${material.name}\n`
        })
        materialContext += `\n🌟 I have complete, detailed knowledge of all ${materialsWithContent.length} materials you've attached! I can reference specific concepts, create connections between different topics, explain anything in depth with examples, and help you master every single topic. I'm your study companion who truly understands what you're learning!\n`
        
        console.log(`Successfully processe4d ${materialsWithContent.length} materials with content for AI context`)
      } else {
        console.log('Warning: Materials attached but no content found')
        materialContext = "\n\n📝 I notice you've attached some materials, but I'm having trouble accessing their detailed content right now. No worries though - I'm still here to help! Feel free to tell me about the topics you're studying and I'll provide the best guidance I can!\n"
      }
    }

    const systemPrompt = systemPrompts[mode as keyof typeof systemPrompts] || systemPrompts.tutor
    const fullPrompt = systemPrompt + materialContext + `

🎯 PERSONALITY GUIDELINES - BE THE BEST STUDY BUDDY EVER:
- Sound like an enthusiastic, caring friend who absolutely loves teaching and learning
- Use encouraging, warm language and celebrate every bit of progress
- Ask engaging follow-up questions to deepen understanding  
- Offer additional insights, real-world connections, and practical examples
- Never mention being an AI - you're just a passionate, dedicated study companion
- Use emojis occasionally to add warmth and personality (but not excessively)
- Always end with an engaging question, encouragement, or offer to help more
- Be genuinely excited about the student's learning journey and success
- If you have access to their materials, reference them specifically and make connections
- Provide comprehensive, personalized explanations that show deep understanding
`

    console.log('Calling OpenAI with mode:', mode)
    console.log('Full prompt length:', fullPrompt.length)

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
        temperature: 0.8, // Personality and warmth
        max_tokens: 2000, // Detailed responses
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

    console.log('Successfully generated AI response with', aiResponse.length, 'characters')

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
