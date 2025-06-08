
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
    const { clues, context, style } = await req.json()
    
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

    // Create AI prompt based on style
    let prompt = ''
    if (style === 'exam-paper') {
      prompt = `Based on the provided course materials and context, generate a complete exam paper with 10-15 questions that would likely appear on an exam for "${context.course}". Include different question types (multiple choice, short answer, long answer, calculations if applicable).

Format the response as JSON with this structure:
{
  "exam_title": "string",
  "duration": "string",
  "instructions": "string",
  "sections": [
    {
      "title": "string",
      "questions": [
        {
          "question_number": number,
          "question": "string",
          "type": "multiple_choice|short_answer|long_answer|calculation",
          "marks": number,
          "options": ["string"] // only for multiple choice
        }
      ]
    }
  ],
  "total_marks": number
}`
    } else {
      prompt = `Based on the provided course materials and context, predict 3-5 specific exam questions that are most likely to appear on an exam for "${context.course}". 

Analyze the materials to identify:
1. Recurring themes and concepts
2. Assignment patterns that often appear in exams
3. Lecturer emphasis areas
4. Complex topics that need detailed understanding

For each predicted question, provide:
- The exact question text
- Confidence score (0-100)
- Reasoning based on the source materials
- Question type (theory/calculation/application)

Format the response as JSON with this structure:
{
  "predictions": [
    {
      "question": "string",
      "confidence": number,
      "reasoning": "string",
      "type": "string",
      "sources": ["string"],
      "difficulty": "easy|medium|hard"
    }
  ],
  "overall_confidence": number,
  "analysis_summary": "string"
}`
    }

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert academic assistant that analyzes course materials to predict exam questions. Provide accurate, realistic predictions based on the provided materials.'
          },
          {
            role: 'user',
            content: `${prompt}\n\nCourse Materials and Context:\n${analysisContent}`
          }
        ],
        temperature: 0.7,
      }),
    })

    if (!openaiResponse.ok) {
      throw new Error('Failed to generate predictions')
    }

    const openaiData = await openaiResponse.json()
    const generatedContent = openaiData.choices[0].message.content

    let parsedResponse
    try {
      parsedResponse = JSON.parse(generatedContent)
    } catch (e) {
      console.error('Failed to parse AI response:', e)
      throw new Error('Invalid AI response format')
    }

    // Ensure confidence score is within valid range (0-100) for integer storage
    let confidenceScore = style === 'exam-paper' ? 85 : parsedResponse.overall_confidence
    confidenceScore = Math.max(0, Math.min(100, Math.round(confidenceScore)))

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
      throw new Error('Failed to save prediction')
    }

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
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
