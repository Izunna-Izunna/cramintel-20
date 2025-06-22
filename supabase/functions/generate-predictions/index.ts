
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PredictionRequest {
  materials: string[];
  context: {
    course: string;
    topics: string[];
    lecturer?: string;
  };
  predictionContext?: {
    lecturer_emphasis?: string;
    assignment_patterns?: string;
    class_rumors?: string;
    topic_emphasis?: string[];
    assignment_focus?: 'calculations' | 'theory' | 'both';
    revision_hints?: string;
  };
  style: 'ranked' | 'practice_exam' | 'topic_based' | 'bullet' | 'theory' | 'mixed' | 'exam-paper';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: user } = await supabaseClient.auth.getUser(token)

    if (!user.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const requestBody: PredictionRequest = await req.json()
    console.log('Generate predictions request:', requestBody)

    // Fetch material contents
    const { data: materials, error: materialsError } = await supabaseClient
      .from('cramintel_materials')
      .select('*')
      .in('id', requestBody.materials)
      .eq('user_id', user.user.id)

    if (materialsError) {
      console.error('Error fetching materials:', materialsError)
      return new Response(JSON.stringify({ error: 'Failed to fetch materials' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Fetch extracted texts for the materials
    const { data: extractedTexts } = await supabaseClient
      .from('cramintel_extracted_texts')
      .select('*')
      .in('material_id', requestBody.materials)

    // Build enhanced system prompt with contextual intelligence
    const systemPrompt = `You are an expert exam question predictor with deep understanding of academic patterns. 
Generate predictions with:

1. CONFIDENCE SCORES (0-100%) based on:
   - Frequency in past questions
   - Emphasis in course materials  
   - Lecturer behavioral cues
   - Assignment topic distribution

2. CLEAR RATIONALES for each prediction explaining:
   - Why this question is likely (evidence from materials)
   - Patterns observed in past questions
   - Lecturer emphasis indicators
   - Cross-references to specific content

3. STUDY PRIORITY RANKINGS:
   - High Priority (60% study time): Most likely questions
   - Medium Priority (30% study time): Moderately likely
   - Low Priority (10% study time): Less likely but possible

4. ENHANCED CONTEXT ANALYSIS:
   ${requestBody.predictionContext?.lecturer_emphasis ? `- Lecturer Emphasis: "${requestBody.predictionContext.lecturer_emphasis}"` : ''}
   ${requestBody.predictionContext?.assignment_patterns ? `- Assignment Patterns: "${requestBody.predictionContext.assignment_patterns}"` : ''}
   ${requestBody.predictionContext?.class_rumors ? `- Class Intelligence: "${requestBody.predictionContext.class_rumors}"` : ''}
   ${requestBody.predictionContext?.topic_emphasis ? `- Emphasized Topics: ${requestBody.predictionContext.topic_emphasis.join(', ')}` : ''}
   ${requestBody.predictionContext?.revision_hints ? `- Revision Hints: "${requestBody.predictionContext.revision_hints}"` : ''}

Generate ${requestBody.style === 'ranked' ? 'confidence-ranked predictions' : 
         requestBody.style === 'practice_exam' ? 'a complete practice exam' : 
         'topic-organized predictions'} for ${requestBody.context.course}.

Return JSON format:
{
  "predictions": [
    {
      "question": "Question text",
      "confidence": 85,
      "rationale": ["Reason 1", "Reason 2", "Reason 3"],
      "sources": ["Material references"],
      "confidence_level": "high|medium|low",
      "study_priority": 1
    }
  ],
  "study_guide": {
    "priority_1": ["High priority topics"],
    "priority_2": ["Medium priority topics"], 
    "priority_3": ["Low priority topics"]
  },
  "overall_confidence": 82,
  "analysis_summary": "Brief analysis of prediction quality"
}`

    // Prepare content for AI
    const materialContents = extractedTexts?.map(et => et.extracted_text).join('\n\n') || 
                           materials.map(m => `Material: ${m.name}\nType: ${m.material_type}`).join('\n\n')

    const userPrompt = `Course: ${requestBody.context.course}
Topics: ${requestBody.context.topics.join(', ')}
${requestBody.context.lecturer ? `Lecturer: ${requestBody.context.lecturer}` : ''}

Materials Content:
${materialContents}

Please generate ${requestBody.style === 'ranked' ? '8-12 ranked' : 
                  requestBody.style === 'practice_exam' ? 'a complete exam with' : '10-15'} predictions.`

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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 3000
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API error:', errorText)
      return new Response(JSON.stringify({ error: 'Failed to generate predictions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const aiResult = await openaiResponse.json()
    let generatedContent

    try {
      generatedContent = JSON.parse(aiResult.choices[0].message.content)
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      // Fallback: create structured response from raw text
      generatedContent = {
        predictions: [{
          question: aiResult.choices[0].message.content,
          confidence: 70,
          rationale: ['Generated from AI analysis'],
          confidence_level: 'medium',
          study_priority: 2
        }],
        overall_confidence: 70,
        analysis_summary: 'Predictions generated successfully'
      }
    }

    // Save prediction to database with enhanced fields
    const { data: savedPrediction, error: saveError } = await supabaseClient
      .from('cramintel_predictions')
      .insert({
        user_id: user.user.id,
        course: requestBody.context.course,
        questions: generatedContent.predictions,
        confidence_score: generatedContent.overall_confidence || 75,
        prediction_type: requestBody.style,
        status: 'active',
        rationale: generatedContent.predictions?.map((p: any) => p.rationale).flat() || [],
        confidence_level: generatedContent.overall_confidence > 80 ? 'high' : 
                         generatedContent.overall_confidence > 60 ? 'medium' : 'low',
        study_priority: 1
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving prediction:', saveError)
    }

    // Save contextual intelligence if provided
    if (requestBody.predictionContext && savedPrediction) {
      await supabaseClient
        .from('prediction_context')
        .insert({
          user_id: user.user.id,
          prediction_session_id: savedPrediction.id,
          lecturer_emphasis: requestBody.predictionContext.lecturer_emphasis,
          assignment_patterns: requestBody.predictionContext.assignment_patterns,
          class_rumors: requestBody.predictionContext.class_rumors,
          topic_emphasis: requestBody.predictionContext.topic_emphasis
        })
    }

    return new Response(JSON.stringify(generatedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in generate-predictions function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
