
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

// Convert PDF to images using PDF.js
async function convertPdfToImages(pdfBuffer: Uint8Array): Promise<Uint8Array[]> {
  try {
    // Import PDF.js for server-side use
    const pdfjsLib = await import('https://esm.sh/pdfjs-dist@3.11.174/legacy/build/pdf.js')
    
    const loadingTask = pdfjsLib.getDocument({ 
      data: pdfBuffer,
      verbosity: 0
    })
    const pdf = await loadingTask.promise
    
    const images: Uint8Array[] = []
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum)
        const scale = 2.0
        const viewport = page.getViewport({ scale })
        
        // Create canvas for rendering
        const canvas = new OffscreenCanvas(viewport.width, viewport.height)
        const context = canvas.getContext('2d')
        
        if (!context) {
          throw new Error('Could not get canvas context')
        }
        
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        }
        
        await page.render(renderContext).promise
        
        // Convert canvas to PNG blob
        const blob = await canvas.convertToBlob({ type: 'image/png' })
        const arrayBuffer = await blob.arrayBuffer()
        const imageBuffer = new Uint8Array(arrayBuffer)
        
        images.push(imageBuffer)
        console.log(`Converted PDF page ${pageNum} to image (${imageBuffer.length} bytes)`)
      } catch (pageError) {
        console.error(`Error converting page ${pageNum}:`, pageError)
      }
    }
    
    return images
  } catch (error) {
    console.error('Error converting PDF to images:', error)
    throw new Error(`Failed to convert PDF to images: ${error.message}`)
  }
}

// Convert text content to image for OCR processing
async function convertTextToImage(textContent: string): Promise<Uint8Array> {
  try {
    console.log('Converting text content to image for OCR processing')
    
    // Create canvas with appropriate size for text
    const canvas = new OffscreenCanvas(800, 1000)
    const context = canvas.getContext('2d')
    
    if (!context) {
      throw new Error('Could not get canvas context')
    }
    
    // Set up text rendering
    context.fillStyle = 'white'
    context.fillRect(0, 0, 800, 1000)
    context.fillStyle = 'black'
    context.font = '14px Arial'
    
    // Split text into lines and render
    const lines = textContent.split('\n')
    const lineHeight = 20
    let y = 30
    
    for (const line of lines) {
      if (y > 980) break // Don't overflow canvas
      context.fillText(line.substring(0, 100), 20, y) // Limit line length
      y += lineHeight
    }
    
    // Convert canvas to PNG
    const blob = await canvas.convertToBlob({ type: 'image/png' })
    const arrayBuffer = await blob.arrayBuffer()
    const imageBuffer = new Uint8Array(arrayBuffer)
    
    console.log(`Converted text to image (${imageBuffer.length} bytes)`)
    return imageBuffer
    
  } catch (error) {
    console.error('Error converting text to image:', error)
    throw new Error(`Failed to convert text to image: ${error.message}`)
  }
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

// OCR function using Google Vision API
async function extractTextFromImage(imageBuffer: Uint8Array): Promise<string> {
  const googleVisionApiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY')
  if (!googleVisionApiKey) {
    throw new Error('Google Vision API key not configured')
  }

  const maxFileSize = 20 * 1024 * 1024
  if (imageBuffer.byteLength > maxFileSize) {
    throw new Error(`Image file too large: ${(imageBuffer.byteLength / 1024 / 1024).toFixed(1)}MB. Maximum allowed: 20MB`)
  }

  try {
    console.log(`Processing image of size: ${(imageBuffer.byteLength / 1024 / 1024).toFixed(2)}MB with OCR`)
    
    const base64Image = arrayBufferToBase64(imageBuffer.buffer)
    
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${googleVisionApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: base64Image,
            },
            features: [
              {
                type: 'DOCUMENT_TEXT_DETECTION',
                maxResults: 1,
              },
            ],
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
      
      // Try document text detection first
      if (responseData.fullTextAnnotation && responseData.fullTextAnnotation.text) {
        const extractedText = responseData.fullTextAnnotation.text
        console.log(`OCR extracted ${extractedText.length} characters using document detection`)
        return extractedText
      }
      
      // Fallback to regular text detection
      const textAnnotations = responseData.textAnnotations
      if (textAnnotations && textAnnotations.length > 0) {
        const extractedText = textAnnotations[0].description || ''
        console.log(`OCR extracted ${extractedText.length} characters using text detection`)
        return extractedText
      }
    }
    
    console.log('No text detected in image')
    return ''
  } catch (error) {
    console.error('OCR extraction failed:', error)
    throw new Error(`OCR processing failed: ${error.message}`)
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

    console.log('Processing material with OCR-only approach:', materialId)

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

    // Update processing status - all files now go through OCR
    await supabase
      .from('cramintel_materials')
      .update({ 
        processing_status: 'processing_ocr',
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
          processing_status: 'converting_to_images',
          processing_progress: 25 
        })
        .eq('id', materialId)

      let imagesToProcess: Uint8Array[] = []

      // Convert all file types to images for OCR processing
      if (material.file_type?.includes('pdf')) {
        console.log('Converting PDF to images for OCR processing')
        imagesToProcess = await convertPdfToImages(fileBuffer)
      } else if (material.file_type?.includes('image')) {
        console.log('Processing image file with OCR')
        imagesToProcess = [fileBuffer]
      } else if (material.file_type?.includes('text')) {
        console.log('Converting text file to image for OCR processing')
        const textContent = new TextDecoder().decode(fileBuffer)
        const textImage = await convertTextToImage(textContent)
        imagesToProcess = [textImage]
      } else {
        // Default: treat as text and convert to image
        console.log('Unknown file type, treating as text and converting to image')
        const textContent = new TextDecoder().decode(fileBuffer)
        const textImage = await convertTextToImage(textContent)
        imagesToProcess = [textImage]
      }

      if (imagesToProcess.length === 0) {
        throw new Error('No images could be generated for OCR processing')
      }

      await supabase
        .from('cramintel_materials')
        .update({ 
          processing_status: 'extracting_text_ocr',
          processing_progress: 40 
        })
        .eq('id', materialId)

      // Process each image with OCR
      const textPages = await Promise.all(
        imagesToProcess.map(async (imageBuffer, index) => {
          try {
            console.log(`Processing image ${index + 1}/${imagesToProcess.length} with OCR`)
            return await extractTextFromImage(imageBuffer)
          } catch (error) {
            console.error(`OCR failed for image ${index + 1}:`, error)
            return `[OCR processing failed for page ${index + 1}: ${error.message}]`
          }
        })
      )

      // Combine all extracted text
      if (imagesToProcess.length > 1) {
        extractedText = textPages.map((text, index) => 
          `--- Page ${index + 1} ---\n\n${text}\n\n`
        ).join('')
      } else {
        extractedText = textPages[0] || ''
      }

      extractionConfidence = isValidExtractedText(extractedText) ? 85 : 35
      
      console.log('OCR processing completed, text length:', extractedText.length, 'confidence:', extractionConfidence)
      
      if (!isValidExtractedText(extractedText)) {
        throw new Error('OCR extracted text is of poor quality or insufficient')
      }
      
    } catch (extractionError) {
      console.error('OCR processing failed:', extractionError)
      throw new Error(`OCR processing failed: ${extractionError.message}`)
    }

    // Store the extracted text in the database
    await storeExtractedText(
      supabase, 
      materialId, 
      extractedText, 
      'ocr_only',
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
      const systemPrompt = `You are an expert educator creating study flashcards from OCR-processed content.

REQUIREMENTS:
- Generate EXACTLY 20 flashcards from the provided OCR-extracted content
- Base questions on the actual content that was extracted via OCR
- Account for potential OCR errors and focus on clear, meaningful content
- Create questions that test understanding of the material
- Provide complete, accurate answers
- Distribute difficulty: 6 easy, 8 medium, 6 hard
- Make questions specific and educational

Return ONLY a JSON array:
[
  {
    "question": "Specific question based on OCR content",
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
              content: `Create 20 flashcards from this OCR-processed ${material.course} material:

${cleanText.substring(0, 12000)}

Course: ${material.course}
Type: ${material.material_type}
Title: ${material.name}
Processing: OCR-Only Extraction`
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

    const deckName = `${material.name} - OCR Flashcards`
    const deckDescription = `Generated from OCR-processed content for ${material.course}`

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

    console.log('Material processing completed successfully with OCR-only approach')

    return new Response(JSON.stringify({
      success: true,
      flashcards_generated: flashcards.length,
      deck_id: deck.id,
      ocr_processed: true,
      extraction_confidence: extractionConfidence,
      message: `Successfully generated ${flashcards.length} flashcards using OCR-only processing`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in OCR-only process-material function:', error)
    
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
      details: 'OCR-only material processing failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
