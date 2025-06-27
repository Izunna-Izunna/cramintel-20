
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FlashcardQuestion {
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic?: string;
}

// Function to validate text quality
function isValidExtractedText(text: string): boolean {
  if (!text || text.trim().length < 50) return false
  
  const repeatedPattern = /(.)\1{10,}/g
  const excessiveNumbers = /\d{20,}/g
  const meaninglessPattern = /^[^a-zA-Z]*$/
  
  if (repeatedPattern.test(text) || excessiveNumbers.test(text) || meaninglessPattern.test(text.slice(0, 100))) {
    return false
  }
  
  const words = text.split(/\s+/).filter(word => word.length > 2)
  const uniqueChars = new Set(text.toLowerCase().split(''))
  
  return words.length >= 10 && uniqueChars.size >= 15
}

// Function to store extracted text
async function storeExtractedText(supabase: any, materialId: string, text: string, method: string, confidence?: number) {
  const wordCount = text.split(/\s+/).length
  const characterCount = text.length
  
  const { data, error } = await supabase
    .from('cramintel_extracted_texts')
    .upsert({
      material_id: materialId,
      extracted_text: text,
      extraction_method: method,
      extraction_confidence: confidence,
      word_count: wordCount,
      character_count: characterCount,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'material_id'
    })

  if (error) {
    console.error('Error storing extracted text:', error)
  } else {
    console.log('Successfully stored extracted text for material:', materialId)
  }
  
  return { data, error }
}

// Chunked base64 conversion to prevent stack overflow for large files
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 8192
  let binary = ''
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize)
    binary += String.fromCharCode.apply(null, Array.from(chunk))
  }
  
  return btoa(binary)
}

// Enhanced function to extract text from both images and PDFs using Google Vision API
async function extractTextFromFile(fileBuffer: Uint8Array, fileType: string): Promise<string> {
  const googleVisionApiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY')
  if (!googleVisionApiKey) {
    throw new Error('Google Vision API key not configured')
  }

  const maxFileSize = 20 * 1024 * 1024
  if (fileBuffer.byteLength > maxFileSize) {
    throw new Error(`File too large: ${(fileBuffer.byteLength / 1024 / 1024).toFixed(1)}MB. Maximum allowed: 20MB`)
  }

  try {
    console.log(`Processing ${fileType} file of size: ${(fileBuffer.byteLength / 1024 / 1024).toFixed(2)}MB with Google Vision API`)
    
    const base64File = arrayBufferToBase64(fileBuffer.buffer)
    
    // Use DOCUMENT_TEXT_DETECTION for both PDFs and images for better text extraction
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${googleVisionApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: base64File,
            },
            features: [
              {
                type: 'DOCUMENT_TEXT_DETECTION',
                maxResults: 1,
              },
            ],
            imageContext: {
              languageHints: ['en'], // Optimize for English text
            },
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google Vision API error response:', errorText)
      throw new Error(`Google Vision API error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log('Google Vision API response received')
    
    if (result.responses && result.responses[0]) {
      const responseData = result.responses[0]
      
      if (responseData.error) {
        throw new Error(`Google Vision API error: ${responseData.error.message}`)
      }
      
      // Try document text detection first (best for PDFs and complex documents)
      if (responseData.fullTextAnnotation && responseData.fullTextAnnotation.text) {
        const extractedText = responseData.fullTextAnnotation.text
        console.log(`Extracted ${extractedText.length} characters using document detection`)
        return extractedText
      }
      
      // Fallback to regular text detection
      const textAnnotations = responseData.textAnnotations
      if (textAnnotations && textAnnotations.length > 0) {
        const extractedText = textAnnotations[0].description || ''
        console.log(`Extracted ${extractedText.length} characters using text detection`)
        return extractedText
      }
    }
    
    console.log('No text detected in file')
    return ''
  } catch (error) {
    console.error('Text extraction failed:', error)
    throw new Error(`Text extraction failed: ${error.message}`)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  let requestBody: any
  try {
    requestBody = await req.json()
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { materialId } = requestBody

    if (!materialId) {
      return new Response(JSON.stringify({ error: 'Material ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Processing material with direct file processing:', materialId)

    // Get material details
    const { data: material, error: materialError } = await supabase
      .from('cramintel_materials')
      .select('*')
      .eq('id', materialId)
      .eq('user_id', user.id)
      .single()

    if (materialError || !material) {
      console.error('Material not found:', materialError)
      return new Response(JSON.stringify({ error: 'Material not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Update processing status
    await supabase
      .from('cramintel_materials')
      .update({ 
        processing_status: 'processing',
        processing_progress: 10 
      })
      .eq('id', materialId)

    let extractedText = ''
    let extractionConfidence = 0

    try {
      // Download the file
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('cramintel-materials')
        .download(material.file_path)

      if (downloadError || !fileData) {
        throw new Error(`Failed to download file: ${downloadError?.message}`)
      }

      const arrayBuffer = await fileData.arrayBuffer()
      const fileBuffer = new Uint8Array(arrayBuffer)
      console.log('File downloaded successfully, size:', fileBuffer.length, 'bytes')
      
      await supabase
        .from('cramintel_materials')
        .update({ 
          processing_status: 'extracting_text',
          processing_progress: 30 
        })
        .eq('id', materialId)

      // Process file directly with Google Vision API (works for both PDFs and images)
      extractedText = await extractTextFromFile(fileBuffer, material.file_type || 'unknown')
      
      extractionConfidence = isValidExtractedText(extractedText) ? 90 : 40
      
      console.log('Text extraction completed, text length:', extractedText.length, 'confidence:', extractionConfidence)
      
      if (!isValidExtractedText(extractedText)) {
        throw new Error('Extracted text is of poor quality or insufficient')
      }
      
    } catch (extractionError) {
      console.error('Text extraction failed:', extractionError)
      throw new Error(`Text extraction failed: ${extractionError.message}`)
    }

    // Store the extracted text in the database
    await storeExtractedText(
      supabase, 
      materialId, 
      extractedText, 
      'google_vision_direct',
      extractionConfidence
    )

    await supabase
      .from('cramintel_materials')
      .update({ 
        processing_status: 'processing_content',
        processing_progress: 50 
      })
      .eq('id', materialId)

    let cleanText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?;:()\-\[\]]/g, '')
      .trim()

    console.log('Cleaned text length:', cleanText.length)

    if (cleanText.length < 100) {
      throw new Error('Insufficient content for flashcard generation')
    }

    await supabase
      .from('cramintel_materials')
      .update({ 
        processing_status: 'generating_flashcards',
        processing_progress: 60 
      })
      .eq('id', materialId)

    // Generate flashcards with OpenAI
    let flashcards: FlashcardQuestion[] = []

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    try {
      const systemPrompt = `You are an expert educator creating study flashcards from extracted content.

REQUIREMENTS:
- Generate EXACTLY 20 flashcards from the provided content
- Base questions on the actual content that was extracted
- Create questions that test understanding of the material
- Provide complete, accurate answers
- Distribute difficulty: 6 easy, 8 medium, 6 hard
- Make questions specific and educational

Return ONLY a JSON array:
[
  {
    "question": "Specific question based on content",
    "answer": "Complete, accurate answer",
    "difficulty": "easy|medium|hard",
    "topic": "specific topic area from content"
  }
]

No text before or after the JSON.`

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `Create 20 flashcards from this ${material.course} material:

${cleanText.substring(0, 12000)}

Course: ${material.course}
Type: ${material.material_type}
Title: ${material.name}`
            }
          ],
          temperature: 0.3,
          max_tokens: 4000,
        }),
      })

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text()
        console.error('OpenAI API error:', errorText)
        throw new Error(`OpenAI API failed: ${openaiResponse.status}`)
      }

      const openaiData = await openaiResponse.json()
      const flashcardsContent = openaiData.choices[0]?.message?.content

      if (!flashcardsContent) {
        throw new Error('No flashcards received from OpenAI')
      }

      flashcards = JSON.parse(flashcardsContent)
      
      if (!Array.isArray(flashcards) || flashcards.length !== 20) {
        console.warn(`Expected 20 flashcards, got ${flashcards.length}`)
        if (flashcards.length < 20) {
          while (flashcards.length < 20) {
            const randomCard = flashcards[Math.floor(Math.random() * flashcards.length)]
            flashcards.push({ ...randomCard })
          }
        } else {
          flashcards = flashcards.slice(0, 20)
        }
      }

      console.log(`Successfully generated ${flashcards.length} flashcards using OpenAI`)
    } catch (openaiError) {
      console.error('OpenAI processing failed:', openaiError)
      throw new Error(`Flashcard generation failed: ${openaiError.message}`)
    }

    await supabase
      .from('cramintel_materials')
      .update({ 
        processing_status: 'saving_flashcards',
        processing_progress: 80 
      })
      .eq('id', materialId)

    const deckName = `${material.name} - Flashcards`
    const deckDescription = `Generated from ${material.course} material using direct text extraction`

    const { data: deck, error: deckError } = await supabase
      .from('cramintel_decks')
      .insert({
        name: deckName,
        description: deckDescription,
        course: material.course,
        user_id: user.id,
        source_materials: [material.name],
        tags: material.tags || [],
        total_cards: flashcards.length
      })
      .select()
      .single()

    if (deckError) {
      console.error('Error creating deck:', deckError)
      throw new Error('Failed to create flashcard deck')
    }

    const flashcardInserts = flashcards.map(card => ({
      question: card.question,
      answer: card.answer,
      course: material.course,
      difficulty_level: card.difficulty || 'medium',
      material_id: materialId,
      user_id: user.id
    }))

    const { data: savedFlashcards, error: flashcardError } = await supabase
      .from('cramintel_flashcards')
      .insert(flashcardInserts)
      .select()

    if (flashcardError) {
      console.error('Error saving flashcards:', flashcardError)
      throw new Error('Failed to save flashcards')
    }

    const deckFlashcardInserts = savedFlashcards.map(flashcard => ({
      deck_id: deck.id,
      flashcard_id: flashcard.id
    }))

    const { error: linkError } = await supabase
      .from('cramintel_deck_flashcards')
      .insert(deckFlashcardInserts)

    if (linkError) {
      console.error('Error linking flashcards:', linkError)
    }

    await supabase
      .from('cramintel_materials')
      .update({ 
        processed: true,
        processing_status: 'completed',
        processing_progress: 100 
      })
      .eq('id', materialId)

    console.log('Material processing completed successfully with direct file processing')

    return new Response(JSON.stringify({
      success: true,
      flashcards_generated: flashcards.length,
      deck_id: deck.id,
      extraction_method: 'google_vision_direct',
      extraction_confidence: extractionConfidence,
      message: `Successfully generated ${flashcards.length} flashcards using direct file processing`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in process-material function:', error)
    
    try {
      const { materialId } = requestBody
      if (materialId) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
        
        await supabase
          .from('cramintel_materials')
          .update({ 
            processing_status: 'error',
            processing_progress: 0 
          })
          .eq('id', materialId)
      }
    } catch (updateError) {
      console.error('Failed to update error status:', updateError)
    }

    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Direct file processing failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
