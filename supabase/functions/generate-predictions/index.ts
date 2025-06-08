
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
    console.log('Generate predictions function called')
    
    const { clues, context, style } = await req.json()
    console.log('Request data:', { clues: clues?.length, context, style })
    
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
      console.error('Unauthorized: No user found')
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    console.log('User authenticated:', user.id)

    // Check for OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.error('OpenAI API key not configured')
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Prepare content for AI analysis
    let analysisContent = `Course: ${context.course}\n`
    analysisContent += `Topics: ${context.topics.join(', ')}\n`
    if (context.lecturer) {
      analysisContent += `Lecturer: ${context.lecturer}\n`
    }
    analysisContent += `\nMaterials to analyze:\n`

    // Add clue content
    clues.forEach((clue: any, index: number) => {
      analysisContent += `\n${index + 1}. ${clue.name} (${clue.type})`
      if (clue.content) {
        analysisContent += `:\n${clue.content}\n`
      }
    })

    console.log('Analysis content prepared, length:', analysisContent.length)

    // Create AI prompt based on style
    let prompt = ''
    let systemPrompt = 'You are an expert academic assistant that analyzes course materials to predict exam questions. You MUST respond with valid JSON only. Do not include any text before or after the JSON response.'
    
    if (style === 'exam-paper') {
      prompt = `Based on the provided course materials and context, generate a complete exam paper with 10-15 questions that would likely appear on an exam for "${context.course}". Include different question types (multiple choice, short answer, long answer, calculations if applicable).

You MUST respond with ONLY valid JSON in this exact structure:
{
  "exam_title": "string",
  "duration": "string", 
  "instructions": "string",
  "sections": [
    {
      "title": "string",
      "questions": [
        {
          "question_number": 1,
          "question": "string",
          "type": "multiple_choice",
          "marks": 5,
          "options": ["A) option1", "B) option2", "C) option3", "D) option4"]
        }
      ]
    }
  ],
  "total_marks": 100
}`
    } else {
      prompt = `Based on the provided course materials and context, predict 3-5 specific exam questions that are most likely to appear on an exam for "${context.course}". 

Analyze the materials to identify:
1. Recurring themes and concepts
2. Assignment patterns that often appear in exams
3. Lecturer emphasis areas
4. Complex topics that need detailed understanding

You MUST respond with ONLY valid JSON in this exact structure:
{
  "predictions": [
    {
      "question": "string",
      "confidence": 85,
      "reasoning": "string",
      "type": "theory",
      "sources": ["string"],
      "difficulty": "medium"
    }
  ],
  "overall_confidence": 85,
  "analysis_summary": "string"
}`
    }

    console.log('Calling OpenAI API with model gpt-4.1-2025-04-14')

    // Call OpenAI API with improved model and error handling
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `${prompt}\n\nCourse Materials and Context:\n${analysisContent}`
          }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API error:', openaiResponse.status, errorText)
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`)
    }

    const openaiData = await openaiResponse.json()
    console.log('OpenAI response received')
    
    if (!openaiData.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI response structure:', openaiData)
      throw new Error('Invalid response from OpenAI API')
    }

    const generatedContent = openaiData.choices[0].message.content.trim()
    console.log('Generated content preview:', generatedContent.substring(0, 200))

    // Parse JSON with improved error handling
    let parsedResponse
    try {
      // Remove any potential markdown formatting
      const cleanedContent = generatedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsedResponse = JSON.parse(cleanedContent)
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError)
      console.error('Raw content:', generatedContent)
      
      // Attempt to create a fallback response
      const fallbackResponse = style === 'exam-paper' ? {
        exam_title: `${context.course} Exam`,
        duration: "2 hours",
        instructions: "Answer all questions. Show your work clearly.",
        sections: [{
          title: "Section A",
          questions: [{
            question_number: 1,
            question: "Based on the course materials, explain the key concepts covered in this course.",
            type: "long_answer",
            marks: 20
          }]
        }],
        total_marks: 100
      } : {
        predictions: [{
          question: "Based on the course materials, explain the main concepts covered in this course.",
          confidence: 75,
          reasoning: "This is a common exam question format based on the uploaded materials.",
          type: "theory",
          sources: ["Course materials"],
          difficulty: "medium"
        }],
        overall_confidence: 75,
        analysis_summary: "Generated fallback prediction due to parsing error."
      }
      
      console.log('Using fallback response')
      parsedResponse = fallbackResponse
    }

    // Validate response structure
    if (style === 'exam-paper') {
      if (!parsedResponse.exam_title || !parsedResponse.sections || !Array.isArray(parsedResponse.sections)) {
        console.error('Invalid exam paper structure:', parsedResponse)
        throw new Error('Generated exam paper has invalid structure')
      }
    } else {
      if (!parsedResponse.predictions || !Array.isArray(parsedResponse.predictions)) {
        console.error('Invalid predictions structure:', parsedResponse)
        throw new Error('Generated predictions have invalid structure')
      }
    }

    // Ensure confidence score is within valid range (0-100) for integer storage
    let confidenceScore = style === 'exam-paper' ? 85 : (parsedResponse.overall_confidence || 75)
    confidenceScore = Math.max(0, Math.min(100, Math.round(confidenceScore)))

    console.log('Saving prediction to database with confidence:', confidenceScore)

    // Save prediction to database
    const predictionData = {
      user_id: user.id,
      course: context.course,
      questions: style === 'exam-paper' ? parsedResponse : parsedResponse.predictions,
      confidence_score: confidenceScore,
      prediction_type: style,
      status: 'active'
    }

    const { data: savedPrediction, error: saveError } = await supabaseClient
      .from('cramintel_predictions')
      .insert(predictionData)
      .select()
      .single()

    if (saveError) {
      console.error('Error saving prediction:', saveError)
      throw new Error(`Failed to save prediction: ${saveError.message}`)
    }

    console.log('Prediction saved successfully:', savedPrediction.id)

    return new Response(
      JSON.stringify({
        success: true,
        prediction: savedPrediction,
        generated_content: parsedResponse
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in generate-predictions function:', error)
    
    // Return more specific error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorResponse = {
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }
    
    return new Response(
      JSON.stringify(errorResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})
