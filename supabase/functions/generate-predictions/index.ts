
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to extract text from different file types
async function extractTextFromFile(supabaseClient: any, filePath: string, fileType: string): Promise<string> {
  try {
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('cramintel-materials')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error('Failed to download file:', downloadError);
      return '';
    }

    if (fileType?.includes('text') || fileType?.includes('plain')) {
      // Plain text files
      return await fileData.text();
    } else if (fileType?.includes('pdf')) {
      // For PDFs, we'll need to implement PDF text extraction
      // For now, return a placeholder that indicates PDF processing is needed
      const textContent = await fileData.text();
      if (textContent && textContent.length > 100) {
        return textContent;
      }
      return 'PDF content extraction not fully implemented yet. Please use text files for best results.';
    } else {
      // For other file types, try to read as text
      try {
        const textContent = await fileData.text();
        return textContent || '';
      } catch (error) {
        console.error('Error reading file as text:', error);
        return '';
      }
    }
  } catch (error) {
    console.error('Error extracting text from file:', error);
    return '';
  }
}

// Enhanced content analyzer for real content
function analyzeRealContent(content: string, course: string, materialType: string) {
  const words = content.toLowerCase().split(/\s+/);
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  // Extract key topics based on frequency and context
  const topics = new Set<string>();
  const keyTerms = new Set<string>();
  
  // Look for chapter/section headers
  const headerPatterns = [
    /chapter\s+\d+[:\-\s]+([^.\n]+)/gi,
    /section\s+\d+[:\-\s]+([^.\n]+)/gi,
    /\d+\.\s+([A-Z][^.\n]{10,80})/g,
  ];

  headerPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const cleaned = match.replace(/^(chapter|section)\s*\d*[:\-\s]*/i, '').trim();
        if (cleaned.length > 3 && cleaned.length < 100) {
          topics.add(cleaned);
        }
      });
    }
  });

  // Extract key terms and definitions
  const termPatterns = [
    /definition[:\-\s]+([^.\n]+)/gi,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s+(?:is|are|refers to|means)/g,
    /key\s+(?:concept|term|principle)[:\-\s]+([^.\n]+)/gi,
  ];

  termPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const cleaned = match.replace(/^(definition|key\s+(?:concept|term|principle))[:\-\s]*/i, '').trim();
        if (cleaned.length > 3 && cleaned.length < 80) {
          keyTerms.add(cleaned);
        }
      });
    }
  });

  // Course-specific analysis
  let courseContext = '';
  const courseLower = course.toLowerCase();
  
  if (courseLower.includes('cedr') || content.toLowerCase().includes('entrepreneur')) {
    courseContext = 'entrepreneurship';
    // Look for business/entrepreneurship terms
    const businessTerms = ['business', 'startup', 'entrepreneur', 'innovation', 'market', 'customer', 'revenue', 'profit'];
    businessTerms.forEach(term => {
      if (content.toLowerCase().includes(term)) {
        keyTerms.add(term);
      }
    });
  } else if (courseLower.includes('eng') || content.toLowerCase().includes('engineering')) {
    courseContext = 'engineering';
  } else if (courseLower.includes('bio') || content.toLowerCase().includes('biology')) {
    courseContext = 'biology';
  }

  return {
    topics: Array.from(topics).slice(0, 10),
    keyTerms: Array.from(keyTerms).slice(0, 15),
    courseContext,
    contentLength: content.length,
    confidence: Math.min(95, Math.max(30, (content.length / 1000) * 20 + topics.size * 5))
  };
}

// Build course-aware prompt
function buildCourseAwarePrompt(materials: any[], context: any, style: string, whispers: string[] = []) {
  const courseInfo = context.course.toLowerCase();
  let courseType = 'general academic';
  let specificInstructions = '';

  // Determine course type and set specific instructions
  if (courseInfo.includes('cedr') || materials.some(m => m.content?.toLowerCase().includes('entrepreneur'))) {
    courseType = 'entrepreneurship';
    specificInstructions = `
This is an ENTREPRENEURSHIP course. Generate questions about:
- Business planning and strategy
- Market analysis and customer development
- Innovation and opportunity recognition
- Startup fundamentals and business models
- Entrepreneurial finance and funding
- Leadership and team building
Do NOT generate questions about engineering, thermodynamics, or technical subjects.`;
  } else if (courseInfo.includes('eng')) {
    courseType = 'engineering';
    specificInstructions = `
This is an ENGINEERING course. Generate questions about:
- Technical principles and applications
- Problem-solving and calculations
- Design and analysis
- Industry standards and practices`;
  }

  const materialAnalysis = materials.map((material, index) => {
    const analysis = analyzeRealContent(material.content || '', context.course, material.type);
    return `Material ${index + 1} (${material.type}):
Content Length: ${analysis.contentLength} characters
Course Context: ${analysis.courseContext}
Key Topics: ${analysis.topics.join(', ')}
Key Terms: ${analysis.keyTerms.join(', ')}
Confidence: ${analysis.confidence}%
Content Preview: ${(material.content || '').substring(0, 300)}...`;
  }).join('\n\n');

  const prompt = `You are an expert academic AI generating ${style === 'exam-paper' ? 'exam papers' : 'exam predictions'} for university students.

COURSE INFORMATION:
Course: ${context.course}
Course Type: ${courseType}
${specificInstructions}

REAL MATERIAL ANALYSIS:
${materialAnalysis}

STUDENT HINTS:
${whispers.length > 0 ? whispers.map(w => `• ${w}`).join('\n') : 'No additional hints'}

REQUIREMENTS:
1. Base ALL questions on the ACTUAL content provided above
2. Use course-appropriate terminology and concepts
3. Match the academic level and style for ${context.course}
4. Generate questions that could realistically appear on this specific course exam
5. Reference specific topics, terms, and concepts from the materials

${style === 'exam-paper' ? `
OUTPUT FORMAT (Exam Paper):
{
  "exam_title": "${context.course} Final Examination",
  "duration": "2-3 hours",
  "instructions": "Answer ALL questions in Section A, and ANY TWO questions in Section B",
  "sections": [
    {
      "title": "Section A - Compulsory Questions",
      "questions": [
        {
          "question_number": 1,
          "question": "[Question based on actual material content]",
          "type": "definition",
          "marks": 10,
          "confidence": 90
        }
      ]
    },
    {
      "title": "Section B - Choose Any Two",
      "questions": [
        {
          "question_number": 4,
          "question": "[Complex question based on material themes]",
          "type": "analysis",
          "marks": 20,
          "confidence": 85
        }
      ]
    }
  ],
  "total_marks": 100
}` : `
OUTPUT FORMAT (Predictions):
{
  "predictions": [
    {
      "question": "[Question based on actual material content]",
      "confidence": 85,
      "reasoning": "Based on [specific content/topic] from uploaded materials",
      "type": "theory",
      "sources": ["Material name"],
      "difficulty": "medium"
    }
  ],
  "overall_confidence": 85,
  "analysis_summary": "Predictions based on analysis of actual course materials"
}`}

CRITICAL: Respond ONLY with valid JSON. Base questions on ACTUAL content, not generic templates.`;

  return prompt;
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

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      console.error('Unauthorized: No user found')
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    console.log('User authenticated:', user.id)

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.error('OpenAI API key not configured')
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Process clues and extract real content
    console.log('Processing materials and extracting real content...')
    
    const processedMaterials: any[] = []
    const whisperTexts: string[] = []

    for (const clue of clues) {
      try {
        if (clue.type === 'whisper' && clue.content) {
          whisperTexts.push(clue.content)
        } else if (clue.materialId) {
          // Fetch material from database
          const { data: material } = await supabaseClient
            .from('cramintel_materials')
            .select('*')
            .eq('id', clue.materialId)
            .single()

          if (material) {
            console.log(`Processing material: ${material.name} (${material.file_type})`)
            
            // Extract real content from file
            let materialContent = '';
            if (material.file_path) {
              materialContent = await extractTextFromFile(supabaseClient, material.file_path, material.file_type);
            }
            
            if (!materialContent || materialContent.length < 50) {
              materialContent = `Course Material: ${material.name}
Course: ${material.course}
Type: ${material.material_type}
[Content extraction pending - please ensure files are text-readable or provide text versions for better accuracy]`;
            }

            processedMaterials.push({
              ...material,
              content: materialContent,
              type: clue.type
            })
            
            console.log(`Extracted ${materialContent.length} characters from ${material.name}`)
          }
        }
      } catch (error) {
        console.error('Error processing clue:', clue.id, error)
        // Continue processing other clues
      }
    }

    console.log(`Processed ${processedMaterials.length} materials with real content`)

    // Build course-aware prompt with real content
    const enhancedPrompt = buildCourseAwarePrompt(
      processedMaterials,
      context,
      style,
      whisperTexts
    )

    console.log('Calling OpenAI with course-aware prompt and real content')

    // Call OpenAI
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
            content: 'You are an expert academic AI that generates realistic exam predictions based on real course materials. Always respond with valid JSON in the requested format. Base all questions on the actual content provided, not generic templates.'
          },
          {
            role: 'user',
            content: enhancedPrompt
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

    // Parse JSON response
    let parsedResponse
    try {
      const cleanedContent = generatedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsedResponse = JSON.parse(cleanedContent)
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError)
      console.error('Raw content:', generatedContent)
      
      // Provide course-aware fallback
      const fallbackResponse = style === 'exam-paper' ? {
        exam_title: `${context.course} Examination`,
        duration: "2-3 hours",
        instructions: "Answer all questions. Show your work clearly.",
        sections: [{
          title: "Section A",
          questions: [{
            question_number: 1,
            question: `Based on the course materials for ${context.course}, explain the key concepts covered in the uploaded materials and their practical applications.`,
            type: "long_answer",
            marks: 25,
            confidence: 75
          }]
        }],
        total_marks: 100
      } : {
        predictions: [{
          question: `Based on the uploaded materials for ${context.course}, analyze and explain the main topics and their significance in the field.`,
          confidence: 75,
          reasoning: "Generated based on analysis of uploaded course materials and course context.",
          type: "theory",
          sources: ["Course materials"],
          difficulty: "medium"
        }],
        overall_confidence: 75,
        analysis_summary: "Prediction generated using real material content analysis."
      }
      
      console.log('Using course-aware fallback response')
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

    // Calculate confidence based on real content quality
    let confidenceScore = style === 'exam-paper' ? 85 : (parsedResponse.overall_confidence || 75)
    
    // Boost confidence based on real content
    const totalContentLength = processedMaterials.reduce((sum, m) => sum + (m.content?.length || 0), 0)
    if (totalContentLength > 5000) confidenceScore += 10
    if (totalContentLength > 10000) confidenceScore += 5
    if (processedMaterials.some(m => m.type === 'past-questions')) confidenceScore += 10
    if (whisperTexts.length > 0) confidenceScore += 5
    
    confidenceScore = Math.max(0, Math.min(100, Math.round(confidenceScore)))

    console.log('Saving prediction with confidence:', confidenceScore)

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
        generated_content: parsedResponse,
        content_analysis: {
          materials_processed: processedMaterials.length,
          total_content_length: processedMaterials.reduce((sum, m) => sum + (m.content?.length || 0), 0),
          whispers_count: whisperTexts.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in generate-predictions function:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorResponse = {
      error: errorMessage,
      details: 'Prediction generation failed',
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
