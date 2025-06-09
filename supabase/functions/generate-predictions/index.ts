
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { extractText, getDocumentProxy } from "npm:unpdf@1.0.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Updated helper function to extract text from different file types using the SAME method as flashcard generation
async function extractTextFromFile(supabaseClient: any, filePath: string, fileType: string): Promise<string> {
  try {
    console.log(`Extracting text from file: ${filePath} (${fileType})`);
    
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('cramintel-materials')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error('Failed to download file:', downloadError);
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    let extractedText = '';

    if (fileType?.includes('pdf')) {
      console.log('Processing PDF file for text extraction');
      
      const arrayBuffer = await fileData.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      console.log('PDF file size:', uint8Array.length, 'bytes');
      
      const pdf = await getDocumentProxy(uint8Array);
      const { text } = await extractText(pdf, { mergePages: true });
      
      console.log('PDF text extraction completed, length:', text.length);
      
      if (text && text.trim().length > 200) {
        extractedText = text;
        console.log('Using extracted PDF text for processing');
      } else {
        throw new Error('Insufficient text content extracted from PDF');
      }
      
    } else if (fileType?.includes('text')) {
      extractedText = await fileData.text();
    } else {
      // Try to read as text for other file types
      try {
        const textContent = await fileData.text();
        if (textContent && textContent.trim().length > 100) {
          extractedText = textContent;
        } else {
          throw new Error('Unable to extract meaningful text from file');
        }
      } catch (error) {
        throw new Error(`Unsupported file type for text extraction: ${fileType}`);
      }
    }

    // Clean and validate extracted text
    const cleanText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?;:()\-\[\]]/g, '')
      .trim();

    console.log('Cleaned text length:', cleanText.length);

    if (cleanText.length < 100) {
      throw new Error('Insufficient content for prediction generation');
    }

    return cleanText;
    
  } catch (error) {
    console.error('Error extracting text from file:', error);
    throw error;
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

// Build course-aware prompt with REAL content only
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

  // Only use materials with substantial real content
  const validMaterials = materials.filter(material => 
    material.content && material.content.length > 200
  );

  if (validMaterials.length === 0) {
    throw new Error('No valid content available for prediction generation. Please ensure uploaded materials contain readable text.');
  }

  const materialAnalysis = validMaterials.map((material, index) => {
    const analysis = analyzeRealContent(material.content, context.course, material.type);
    return `Material ${index + 1} (${material.type}):
Content Length: ${analysis.contentLength} characters
Course Context: ${analysis.courseContext}
Key Topics: ${analysis.topics.join(', ')}
Key Terms: ${analysis.keyTerms.join(', ')}
Confidence: ${analysis.confidence}%
Content Sample: ${material.content.substring(0, 500)}...`;
  }).join('\n\n');

  const prompt = `You are an expert academic AI generating ${style === 'exam-paper' ? 'exam papers' : 'exam predictions'} for university students.

COURSE INFORMATION:
Course: ${context.course}
Course Type: ${courseType}
${specificInstructions}

REAL MATERIAL ANALYSIS:
${materialAnalysis}

STUDENT HINTS:
${whispers.length > 0 ? whispers.map(w => `• ${w}`).join('\n') : 'No additional hints provided'}

CRITICAL REQUIREMENTS:
1. Base ALL questions EXCLUSIVELY on the ACTUAL content provided above
2. DO NOT create generic or template questions
3. Use specific terms, concepts, and information from the uploaded materials
4. Reference exact topics and details found in the content
5. Generate questions that could only be answered by someone who studied these specific materials
6. Match the academic level and terminology used in the source materials

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
          "question": "[Question based on specific content from materials]",
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
          "question": "[Complex question based on specific material themes]",
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
      "question": "[Question based on specific content from materials]",
      "confidence": 85,
      "reasoning": "Based on [specific content/topic] from uploaded materials",
      "type": "theory",
      "sources": ["Material name"],
      "difficulty": "medium"
    }
  ],
  "overall_confidence": 85,
  "analysis_summary": "Predictions based on analysis of real course materials"
}`}

RESPOND ONLY with valid JSON. NO generic content. ALL questions must reference specific material content.`;

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

    // Process clues and extract real content using SAME method as flashcard generation
    console.log('Processing materials and extracting real content using PDF extraction...')
    
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
            
            // Extract real content using the SAME method as flashcard generation
            let materialContent = '';
            if (material.file_path) {
              materialContent = await extractTextFromFile(supabaseClient, material.file_path, material.file_type);
            }
            
            if (!materialContent || materialContent.length < 100) {
              throw new Error(`Unable to extract sufficient content from ${material.name}. Please ensure the file contains readable text.`);
            }

            processedMaterials.push({
              ...material,
              content: materialContent,
              type: clue.type
            })
            
            console.log(`Successfully extracted ${materialContent.length} characters from ${material.name}`)
          }
        }
      } catch (error) {
        console.error('Error processing clue:', clue.id, error)
        throw new Error(`Failed to process material: ${error.message}`);
      }
    }

    console.log(`Processed ${processedMaterials.length} materials with real content`)

    if (processedMaterials.length === 0) {
      throw new Error('No valid materials with extractable content found. Please upload materials with readable text content.');
    }

    // Build course-aware prompt with real content only
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
            content: 'You are an expert academic AI that generates realistic exam predictions based EXCLUSIVELY on real course materials. You MUST base all questions on the actual content provided. NEVER generate generic or template questions. Always respond with valid JSON in the requested format.'
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
      throw new Error('Failed to parse AI response. Please try again.');
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
