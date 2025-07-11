
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PredictionClue {
  id: string;
  name: string;
  type: 'past-questions' | 'assignment' | 'whisper';
  content?: string;
  materialId?: string;
}

interface PredictionRequest {
  clues: PredictionClue[];
  context: {
    course: string;
    topics?: string[];
    lecturer?: string;
    materials?: Array<{ name: string; type: string }>;
    targetCount?: number;
  };
  predictionContext?: {
    lecturer_emphasis?: string;
    assignment_patterns?: string;
    class_rumors?: string;
    topic_emphasis?: string[];
    assignment_focus?: 'calculations' | 'theory' | 'both';
    revision_hints?: string;
  };
  style: 'ranked' | 'practice_exam' | 'topic_based' | 'bullet' | 'theory' | 'mixed' | 'exam-paper' | 'objective_bulk';
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
      console.error('Unauthorized request - no user')
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Unauthorized' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const requestBody: PredictionRequest = await req.json()
    console.log('Generate predictions request:', requestBody)

    // Validate request data
    if (!requestBody.clues || !Array.isArray(requestBody.clues) || requestBody.clues.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No materials provided for prediction generation' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Fetch material contents for clues that have materialId
    const materialIds = requestBody.clues
      .filter(clue => clue.materialId)
      .map(clue => clue.materialId!)

    let materials: any[] = []
    let extractedTexts: any[] = []

    if (materialIds.length > 0) {
      const { data: materialsData, error: materialsError } = await supabaseClient
        .from('cramintel_materials')
        .select('*')
        .in('id', materialIds)
        .eq('user_id', user.user.id)

      if (materialsError) {
        console.error('Error fetching materials:', materialsError)
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch materials' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      materials = materialsData || []

      // Fetch extracted texts for the materials
      const { data: extractedTextsData } = await supabaseClient
        .from('cramintel_extracted_texts')
        .select('*')
        .in('material_id', materialIds)

      extractedTexts = extractedTextsData || []
    }

    // Build enhanced system prompt based on prediction style
    let systemPrompt = ''
    let questionCount = 10

    if (requestBody.style === 'objective_bulk') {
      questionCount = requestBody.context.targetCount || 25
      systemPrompt = `You are an expert exam question generator specializing in OBJECTIVE QUESTIONS. You MUST respond with valid JSON only.

CRITICAL: Your response must be valid JSON that follows this EXACT structure:

{
  "success": true,
  "data": {
    "predictions": [
      {
        "question": "Clear, specific question text here",
        "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
        "correct_answer": "A",
        "confidence": 85,
        "rationale": ["Reason 1", "Reason 2"],
        "sources": ["Material section/chapter reference"],
        "confidence_level": "high",
        "study_priority": 1,
        "type": "objective",
        "marks": 2,
        "topic": "Specific topic from material"
      }
    ],
    "overall_confidence": 82,
    "analysis_summary": "Brief analysis of question coverage and quality",
    "material_coverage": {
      "topics_covered": ["Topic 1", "Topic 2", "Topic 3"],
      "sections_analyzed": ["Section 1", "Section 2"]
    }
  }
}

OBJECTIVE QUESTION REQUIREMENTS:
1. Generate EXACTLY ${questionCount} multiple-choice questions
2. Each question must have 4 options (A, B, C, D)
3. Clearly indicate the correct answer
4. Questions must cover ALL major topics from the materials
5. Ensure comprehensive coverage - don't focus on just one section
6. Make questions specific and detailed, not generic
7. Base every question on actual content from the uploaded materials
8. Include page/section references where possible
9. Vary difficulty levels across questions
10. Avoid duplicate or very similar questions

QUALITY STANDARDS:
- Each question should test understanding, not just memorization
- Options should be plausible but clearly distinguishable
- Questions should reference specific facts, concepts, or examples from materials
- Maintain academic rigor appropriate for university level

Generate ${questionCount} high-quality objective questions for ${requestBody.context.course}.

Context Analysis:
${requestBody.predictionContext?.lecturer_emphasis ? `- Lecturer Emphasis: "${requestBody.predictionContext.lecturer_emphasis}"` : ''}
${requestBody.predictionContext?.assignment_patterns ? `- Assignment Patterns: "${requestBody.predictionContext.assignment_patterns}"` : ''}
${requestBody.predictionContext?.class_rumors ? `- Class Intelligence: "${requestBody.predictionContext.class_rumors}"` : ''}
${requestBody.predictionContext?.topic_emphasis ? `- Emphasized Topics: ${requestBody.predictionContext.topic_emphasis.join(', ')}` : ''}
${requestBody.predictionContext?.revision_hints ? `- Revision Hints: "${requestBody.predictionContext.revision_hints}"` : ''}

Remember: Respond with VALID JSON ONLY. No explanatory text before or after the JSON.`
    } else {
      // Keep existing system prompt for other styles
      systemPrompt = `You are an expert exam question predictor. You MUST respond with valid JSON only.

CRITICAL: Your response must be valid JSON that follows this exact structure:

{
  "success": true,
  "data": {
    "predictions": [
      {
        "question": "Question text here",
        "confidence": 85,
        "rationale": ["Reason 1", "Reason 2"],
        "sources": ["Material references"],
        "confidence_level": "high",
        "study_priority": 1,
        "type": "theory",
        "marks": 15
      }
    ],
    "study_guide": {
      "priority_1": ["High priority topics"],
      "priority_2": ["Medium priority topics"], 
      "priority_3": ["Low priority topics"]
    },
    "overall_confidence": 82,
    "analysis_summary": "Brief analysis of prediction quality"
  }
}

Generate predictions with:
1. CONFIDENCE SCORES (0-100%) based on material frequency and emphasis
2. CLEAR RATIONALES explaining why each question is likely
3. STUDY PRIORITY RANKINGS (1=highest, 3=lowest)

Context Analysis:
${requestBody.predictionContext?.lecturer_emphasis ? `- Lecturer Emphasis: "${requestBody.predictionContext.lecturer_emphasis}"` : ''}
${requestBody.predictionContext?.assignment_patterns ? `- Assignment Patterns: "${requestBody.predictionContext.assignment_patterns}"` : ''}
${requestBody.predictionContext?.class_rumors ? `- Class Intelligence: "${requestBody.predictionContext.class_rumors}"` : ''}
${requestBody.predictionContext?.topic_emphasis ? `- Emphasized Topics: ${requestBody.predictionContext.topic_emphasis.join(', ')}` : ''}
${requestBody.predictionContext?.revision_hints ? `- Revision Hints: "${requestBody.predictionContext.revision_hints}"` : ''}

Generate ${requestBody.style === 'ranked' ? '8-12 confidence-ranked predictions' : 
         requestBody.style === 'practice_exam' ? 'a complete practice exam structure' : 
         '10-15 topic-organized predictions'} for ${requestBody.context.course}.

Remember: Respond with VALID JSON ONLY. No explanatory text before or after the JSON.`
    }

    // Prepare content for AI
    const materialContents = extractedTexts.length > 0 
      ? extractedTexts.map(et => `Material: ${et.material_id}\nContent: ${et.extracted_text}`).join('\n\n---\n\n')
      : materials.map(m => `Material: ${m.name}\nType: ${m.material_type}\nCourse: ${m.course}`).join('\n\n')

    const clueContents = requestBody.clues
      .map(clue => `${clue.name}: ${clue.content || 'No content available'}`)
      .join('\n')

    // Fix the topics issue - provide fallback topics
    const topics = requestBody.context.topics || ['General Topics']
    
    const userPrompt = `Course: ${requestBody.context.course}
Topics: ${topics.join(', ')}
${requestBody.context.lecturer ? `Lecturer: ${requestBody.context.lecturer}` : ''}
${requestBody.context.materials ? `Materials Count: ${requestBody.context.materials.length}` : ''}

Materials and Clues:
${materialContents}
${clueContents}

Please generate ${requestBody.style === 'objective_bulk' ? 'objective questions' : 'predictions'} in the required JSON format.`

    console.log('Calling OpenAI with model: gpt-4o-mini')

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: requestBody.style === 'objective_bulk' ? 0.8 : 0.7,
        max_tokens: requestBody.style === 'objective_bulk' ? 8000 : 4000
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API error:', errorText)
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'AI service temporarily unavailable. Please try again.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const aiResult = await openaiResponse.json()
    console.log('OpenAI response:', aiResult)

    let generatedContent
    const aiResponseText = aiResult.choices[0].message.content

    try {
      // Try to parse as JSON
      generatedContent = JSON.parse(aiResponseText)
      
      // Validate the structure
      if (!generatedContent.success || !generatedContent.data || !generatedContent.data.predictions) {
        throw new Error('Invalid response structure from AI')
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError)
      console.log('Raw AI response:', aiResponseText)
      
      // Create fallback structured response
      generatedContent = {
        success: true,
        data: {
          predictions: [{
            question: "AI generated response was not in proper format. Please try again with different materials.",
            confidence: 50,
            rationale: ['AI response parsing failed'],
            confidence_level: 'low',
            study_priority: 3,
            type: requestBody.style === 'objective_bulk' ? 'objective' : 'theory',
            marks: requestBody.style === 'objective_bulk' ? 2 : 15
          }],
          overall_confidence: 50,
          analysis_summary: 'Response format error - please try again',
          study_guide: {
            priority_1: ['Try uploading more specific materials'],
            priority_2: ['Check material content quality'],
            priority_3: ['Contact support if issue persists']
          }
        }
      }
    }

    // Save prediction to database with enhanced fields
    try {
      const { data: savedPrediction, error: saveError } = await supabaseClient
        .from('cramintel_predictions')
        .insert({
          user_id: user.user.id,
          course: requestBody.context.course,
          questions: generatedContent.data.predictions,
          confidence_score: generatedContent.data.overall_confidence || 75,
          prediction_type: requestBody.style,
          status: 'active',
          rationale: generatedContent.data.predictions?.map((p: any) => p.rationale).flat() || [],
          confidence_level: generatedContent.data.overall_confidence > 80 ? 'high' : 
                           generatedContent.data.overall_confidence > 60 ? 'medium' : 'low',
          study_priority: 1
        })
        .select()
        .single()

      if (saveError) {
        console.error('Error saving prediction:', saveError)
      } else {
        console.log('Prediction saved successfully:', savedPrediction?.id)
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
    } catch (dbError) {
      console.error('Database operation failed:', dbError)
      // Continue execution - don't fail the whole request for DB issues
    }

    return new Response(JSON.stringify(generatedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in generate-predictions function:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error. Please try again.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
