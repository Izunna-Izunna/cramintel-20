
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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

    console.log(`Starting processing for material: ${materialId}`)

    // Get material from database
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

    // Update status to processing
    await supabase
      .from('cramintel_materials')
      .update({ 
        processing_status: 'processing',
        processing_progress: 10,
        error_message: null
      })
      .eq('id', materialId)

    console.log(`Processing: ${material.name} (${material.file_size} bytes)`)

    // Download file from Supabase storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('cramintel-materials')
      .download(material.file_path)

    if (downloadError) {
      console.error('File download error:', downloadError)
      throw new Error(`Failed to download file: ${downloadError.message}`)
    }

    console.log('File downloaded successfully')

    // Update progress
    await supabase
      .from('cramintel_materials')
      .update({ 
        processing_status: 'extracting_text',
        processing_progress: 30 
      })
      .eq('id', materialId)

    // Convert to base64 - FIXED: Proper conversion method
    const arrayBuffer = await fileData.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    // Check file size to prevent memory issues
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
    if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
      throw new Error(`File too large (${Math.round(arrayBuffer.byteLength / 1024 / 1024)}MB). Maximum size is 10MB.`)
    }

    console.log(`Processing file of size: ${Math.round(arrayBuffer.byteLength / 1024)}KB`)

    // FIXED: Convert entire binary data to string first, then encode as base64
    let binaryString = ''
    
    // Convert all bytes to characters in one pass
    for (let i = 0; i < uint8Array.length; i++) {
      binaryString += String.fromCharCode(uint8Array[i])
    }
    
    // Now encode the entire binary string as base64
    const base64Content = btoa(binaryString)
    
    console.log(`File converted to base64, size: ${Math.round(base64Content.length / 1024)}KB`)

    // Extract text based on file type
    const fileExtension = material.file_name.toLowerCase().split('.').pop()
    let extractedText = ''

    try {
      if (fileExtension === 'pdf') {
        console.log('Processing PDF using document file annotation')
        extractedText = await processWithDocumentFileAnnotation(base64Content)
      } else {
        console.log('Processing image using standard image annotation')
        extractedText = await processWithImageAnnotation(base64Content)
      }
    } catch (extractionError) {
      console.error('Text extraction failed:', extractionError)
      throw new Error(`Text extraction failed: ${extractionError.message}`)
    }

    if (!extractedText || extractedText.trim().length < 50) {
      throw new Error('Insufficient content extracted from document. Please ensure the document contains readable text.')
    }

    console.log(`Successfully extracted ${extractedText.length} characters`)

    // Store extracted text
    await storeExtractedText(supabase, materialId, extractedText, 'google_vision_api', 90)

    // Update progress
    await supabase
      .from('cramintel_materials')
      .update({ 
        processing_status: 'generating_flashcards',
        processing_progress: 60 
      })
      .eq('id', materialId)

    // Generate flashcards
    const flashcards = await generateFlashcards(extractedText, material)

    await supabase
      .from('cramintel_materials')
      .update({ 
        processing_status: 'saving_flashcards',
        processing_progress: 80 
      })
      .eq('id', materialId)

    // Create deck and save flashcards
    const deckName = `${material.name} - Flashcards`
    const deckDescription = `Generated from ${material.course} material`

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
        processing_progress: 100,
        error_message: null
      })
      .eq('id', materialId)

    console.log(`Processing completed successfully for: ${material.name}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        materialId,
        flashcards_generated: flashcards.length,
        deck_id: deck.id,
        textLength: extractedText.length,
        message: 'Processing completed successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Processing error:', error)
    
    // Update material status to error with detailed message  
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      
      const { materialId } = requestBody || {}
      
      if (materialId) {
        await supabase
          .from('cramintel_materials')
          .update({
            processing_status: 'error',
            processing_progress: 0,
            error_message: error.message
          })
          .eq('id', materialId)
      }
    } catch (dbError) {
      console.error('Failed to update error status:', dbError)
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'Check function logs for more information'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Function to process PDFs using the correct document annotation API
async function processWithDocumentFileAnnotation(base64Content: string): Promise<string> {
  const apiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY') || Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY')
  if (!apiKey) {
    throw new Error('Google Cloud Vision API key not configured')
  }

  console.log('Using document file annotation for PDF processing')

  // Use the correct Google Vision API endpoint for PDF files
  const response = await fetch(
    `https://vision.googleapis.com/v1/files:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            inputConfig: {
              mimeType: 'application/pdf',
              content: base64Content
            },
            features: [
              {
                type: 'DOCUMENT_TEXT_DETECTION'
              }
            ],
            pages: [1, 2, 3, 4, 5] // Process first 5 pages
          }
        ]
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Google Vision PDF API error:', errorText)
    throw new Error(`Google Vision PDF API error: ${response.status} - ${errorText}`)
  }

  const result = await response.json()
  console.log('Google Vision PDF API response received')

  if (result.responses?.[0]?.error) {
    const apiError = result.responses[0].error
    console.error('Vision PDF API returned error:', apiError)
    throw new Error(`Vision PDF API error: ${apiError.message || 'Unknown error'}`)
  }

  // Extract text from PDF response structure
  const responses = result.responses || []
  let fullText = ''

  for (const response of responses) {
    if (response.fullTextAnnotation?.text) {
      fullText += response.fullTextAnnotation.text + '\n'
    }
  }

  if (fullText.trim().length === 0) {
    throw new Error('No text found in PDF document')
  }

  console.log(`Extracted ${fullText.length} characters from PDF`)
  return fullText.trim()
}

// Function to process images using standard image annotation API
async function processWithImageAnnotation(base64Content: string): Promise<string> {
  const apiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY') || Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY')
  if (!apiKey) {
    throw new Error('Google Cloud Vision API key not configured')
  }

  console.log(`Processing base64 content of size: ${Math.round(base64Content.length / 1024)}KB`)

  // Use Google Vision API REST endpoint
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: base64Content
            },
            features: [
              {
                type: 'DOCUMENT_TEXT_DETECTION',
                maxResults: 1
              }
            ],
            imageContext: {
              languageHints: ['en']
            }
          }
        ]
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Google Vision API error:', errorText)
    throw new Error(`Google Vision API error: ${response.status} - ${errorText}`)
  }

  const result = await response.json()
  console.log('Google Vision API response received')

  if (result.responses?.[0]?.error) {
    const apiError = result.responses[0].error
    console.error('Vision API returned error:', apiError)
    throw new Error(`Vision API error: ${apiError.message || 'Unknown error'}`)
  }

  // Extract text from response
  const textAnnotations = result.responses?.[0]?.textAnnotations
  if (!textAnnotations || textAnnotations.length === 0) {
    // Try fullTextAnnotation as fallback
    const fullTextAnnotation = result.responses?.[0]?.fullTextAnnotation
    if (fullTextAnnotation?.text) {
      return fullTextAnnotation.text
    }
    throw new Error('No text found in the document. Please ensure the document contains readable text.')
  }

  // First annotation contains the full text
  const fullText = textAnnotations[0]?.description || ''
  
  if (fullText.trim().length === 0) {
    throw new Error('No readable text found in the document')
  }

  return fullText
}

// Store extracted text function
async function storeExtractedText(supabase: any, materialId: string, text: string, method: string, confidence: number) {
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

// Generate flashcards function
async function generateFlashcards(extractedText: string, material: any): Promise<FlashcardQuestion[]> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured')
  }

  const cleanText = extractedText
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,!?;:()\-\[\]]/g, '')
    .trim()

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

  let flashcards: FlashcardQuestion[] = []
  
  try {
    flashcards = JSON.parse(flashcardsContent)
  } catch (parseError) {
    console.error('Failed to parse flashcards JSON:', parseError)
    throw new Error('Invalid flashcards format received from OpenAI')
  }
  
  if (!Array.isArray(flashcards) || flashcards.length < 10) {
    throw new Error(`Expected at least 10 flashcards, got ${flashcards.length}`)
  }

  // Ensure we have exactly 20 flashcards
  if (flashcards.length < 20) {
    while (flashcards.length < 20) {
      const randomCard = flashcards[Math.floor(Math.random() * flashcards.length)]
      flashcards.push({ ...randomCard })
    }
  } else if (flashcards.length > 20) {
    flashcards = flashcards.slice(0, 20)
  }

  console.log(`Successfully generated ${flashcards.length} flashcards using OpenAI`)
  return flashcards
}
