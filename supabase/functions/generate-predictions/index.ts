
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { extractText, getDocumentProxy } from "npm:unpdf@1.0.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to extract text from files (same as flashcard generation)
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

// Build simplified prompt based on real content
function buildSimplifiedPrompt(materials: any[], context: any, style: string, whispers: string[] = []) {
  console.log('Building prompt for materials:', materials.length);
  
  // Only use materials with substantial real content
  const validMaterials = materials.filter(material => 
    material.content && material.content.length > 200
  );

  if (validMaterials.length === 0) {
    throw new Error('No valid content available for prediction generation');
  }

  // Combine all material content
  const combinedContent = validMaterials.map((material, index) => 
    `Material ${index + 1} (${material.name}): ${material.content.substring(0, 2000)}`
  ).join('\n\n');

  const prompt = `You are an expert academic AI that generates exam predictions based EXCLUSIVELY on provided course materials.

COURSE: ${context.course}
STYLE: ${style}

MATERIALS CONTENT:
${combinedContent}

${whispers.length > 0 ? `STUDENT HINTS: ${whispers.join(', ')}` : ''}

CRITICAL REQUIREMENTS:
1. Generate questions ONLY from the actual content provided above
2. Use specific terms, concepts, and examples from the materials
3. Reference exact topics and details found in the content
4. Questions must be answerable only by someone who studied these specific materials
5. Match the academic level of the source materials

${style === 'exam-paper' ? `
OUTPUT FORMAT (Exam Paper):
{
  "exam_title": "${context.course} Examination",
  "duration": "2-3 hours",
  "instructions": "Answer ALL questions",
  "sections": [
    {
      "title": "Section A",
      "questions": [
        {
          "question": "[Specific question from material content]",
          "type": "theory",
          "marks": 15,
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
      "question": "[Specific question from material content]",
      "confidence": 85,
      "reasoning": "Based on [specific topic] from materials",
      "type": "theory",
      "sources": ["${validMaterials[0]?.name || 'Material 1'}"]
    }
  ],
  "overall_confidence": 85
}`}

Generate 3-5 questions based on the most important topics from the provided materials.
Respond ONLY with valid JSON. NO explanations outside the JSON.`;

  console.log('Generated prompt length:', prompt.length);
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

    // Extract real content from materials
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
            
            // Extract real content
            let materialContent = '';
            if (material.file_path) {
              materialContent = await extractTextFromFile(supabaseClient, material.file_path, material.file_type);
            }
            
            if (!materialContent || materialContent.length < 100) {
              throw new Error(`Unable to extract sufficient content from ${material.name}`);
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
      throw new Error('No valid materials found. Please upload materials with readable content.');
    }

    // Build simplified prompt
    const prompt = buildSimplifiedPrompt(processedMaterials, context, style, whisperTexts)

    console.log('Calling OpenAI with simplified prompt...')

    // Call OpenAI with better model
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
            content: 'You are an expert academic AI that generates exam predictions based exclusively on provided course materials. Always respond with valid JSON in the requested format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 3000,
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API error:', openaiResponse.status, errorText)
      throw new Error(`OpenAI API error: ${openaiResponse.status}`)
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
      console.log('Successfully parsed response:', Object.keys(parsedResponse))
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError)
      console.error('Raw content:', generatedContent)
      throw new Error('Failed to parse AI response. Please try again.');
    }

    // Validate response structure
    if (style === 'exam-paper') {
      if (!parsedResponse.exam_title || !parsedResponse.sections) {
        console.error('Invalid exam paper structure:', Object.keys(parsedResponse))
        throw new Error('Generated exam paper has invalid structure')
      }
    } else {
      if (!parsedResponse.predictions || !Array.isArray(parsedResponse.predictions)) {
        console.error('Invalid predictions structure:', Object.keys(parsedResponse))
        throw new Error('Generated predictions have invalid structure')
      }
    }

    // Calculate confidence
    let confidenceScore = parsedResponse.overall_confidence || 80
    if (processedMaterials.length > 1) confidenceScore += 5
    if (whisperTexts.length > 0) confidenceScore += 5
    confidenceScore = Math.min(100, Math.max(50, confidenceScore))

    console.log('Saving prediction with confidence:', confidenceScore)

    // Save prediction to database
    const predictionData = {
      user_id: user.id,
      course: context.course,
      questions: style === 'exam-paper' ? [parsedResponse] : parsedResponse.predictions,
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

    // Return simplified response structure that matches frontend expectations
    const responseData = {
      success: true,
      data: parsedResponse, // This will be passed to onGenerationComplete
      prediction: savedPrediction
    }

    console.log('Returning response data:', Object.keys(responseData))

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in generate-predictions function:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorResponse = {
      success: false,
      error: errorMessage,
      details: 'Prediction generation failed'
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
