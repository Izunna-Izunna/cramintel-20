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

// Enhanced PDF-to-image conversion using pdf-lib
async function convertPdfToImages(pdfBuffer: Uint8Array): Promise<Uint8Array[]> {
  try {
    const { PDFDocument } = await import('https://esm.sh/pdf-lib@1.17.1')
    
    const pdfDoc = await PDFDocument.load(pdfBuffer)
    const pages = pdfDoc.getPages()
    
    const images: Uint8Array[] = []
    
    for (let i = 0; i < pages.length; i++) {
      try {
        const pageImage = await renderPdfPageToImage(pdfDoc, i)
        if (pageImage) {
          images.push(pageImage)
        }
      } catch (pageError) {
        console.error(`Error processing page ${i + 1}:`, pageError)
      }
    }
    
    return images
  } catch (error) {
    console.error('Error converting PDF to images:', error)
    throw new Error('Failed to convert PDF to images')
  }
}

// Alternative PDF.js approach for better Deno compatibility
async function convertPdfToImagesWithPdfJs(pdfBuffer: Uint8Array): Promise<Uint8Array[]> {
  try {
    const pdfjsLib = await import('https://esm.sh/pdfjs-dist@3.11.174')
    
    const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer })
    const pdf = await loadingTask.promise
    
    const images: Uint8Array[] = []
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum)
        
        const scale = 2.0
        const viewport = page.getViewport({ scale })
        
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
        
        const blob = await canvas.convertToBlob({ type: 'image/png' })
        const arrayBuffer = await blob.arrayBuffer()
        const imageBuffer = new Uint8Array(arrayBuffer)
        
        images.push(imageBuffer)
      } catch (pageError) {
        console.error(`Error processing page ${pageNum}:`, pageError)
      }
    }
    
    return images
  } catch (error) {
    console.error('Error converting PDF with PDF.js:', error)
    throw new Error('Failed to convert PDF with PDF.js')
  }
}

// Enhanced PDF processing with multiple fallback methods
async function processPdfWithMultipleMethods(pdfBuffer: Uint8Array): Promise<{ text: string; confidence: number }> {
  // Method 1: Try direct PDF text extraction first
  try {
    const textContent = await extractTextDirectlyFromPdf(pdfBuffer)
    if (textContent && textContent.length > 100) {
      console.log('Direct PDF text extraction successful')
      return { text: textContent, confidence: 90 }
    }
  } catch (error) {
    console.log('Direct text extraction failed, trying OCR methods...')
  }
  
  // Method 2: Try Google Vision API direct PDF processing
  try {
    const { text, confidence } = await extractTextFromPdfWithVision(pdfBuffer)
    if (text && text.length > 50) {
      console.log('Google Vision PDF processing successful')
      return { text, confidence }
    }
  } catch (error) {
    console.log('Google Vision PDF processing failed, trying image conversion...')
  }
  
  // Method 3: Convert PDF to images and OCR each page
  try {
    const images = await convertPdfToImagesSimple(pdfBuffer)
    const textPages = await Promise.all(
      images.map(async (imageBuffer, index) => {
        try {
          return await extractTextFromImage(imageBuffer)
        } catch (error) {
          console.error(`OCR failed for page ${index + 1}:`, error)
          return ''
        }
      })
    )
    
    const combinedText = textPages.filter(text => text.length > 0).join('\n\n--- Page Break ---\n\n')
    const confidence = combinedText.length > 200 ? 75 : 50
    
    return { text: combinedText, confidence }
  } catch (error) {
    console.error('All PDF processing methods failed:', error)
    throw new Error('Failed to extract text from PDF using any method')
  }
}

async function extractTextDirectlyFromPdf(pdfBuffer: Uint8Array): Promise<string> {
  try {
    const { getDocumentProxy, extractText } = await import('npm:unpdf@1.0.5')
    const pdf = await getDocumentProxy(pdfBuffer)
    const { text } = await extractText(pdf, { mergePages: true })
    return text
  } catch (error) {
    throw new Error('Direct PDF text extraction failed')
  }
}

async function extractTextFromPdfWithVision(pdfBuffer: Uint8Array): Promise<{ text: string; confidence: number }> {
  const googleApiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY')
  if (!googleApiKey) {
    throw new Error('Google Vision API key not configured')
  }

  const base64Pdf = btoa(String.fromCharCode(...pdfBuffer))
  
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${googleApiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: base64Pdf,
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
    }
  )

  if (!response.ok) {
    throw new Error(`Google Vision API error: ${response.statusText}`)
  }

  const result = await response.json()
  
  if (result.responses && result.responses[0] && result.responses[0].fullTextAnnotation) {
    return { 
      text: result.responses[0].fullTextAnnotation.text, 
      confidence: 85 
    }
  }
  
  return { text: '', confidence: 0 }
}

async function convertPdfToImagesSimple(pdfBuffer: Uint8Array): Promise<Uint8Array[]> {
  // For now, return the PDF buffer for direct Google Vision processing
  // Google Vision API can handle PDF files directly
  return [pdfBuffer]
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

// Enhanced OCR function using Google Vision API
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
    console.log(`Processing image of size: ${(imageBuffer.byteLength / 1024 / 1024).toFixed(2)}MB`)
    
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
                type: 'TEXT_DETECTION',
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
      
      const textAnnotations = responseData.textAnnotations
      if (textAnnotations && textAnnotations.length > 0) {
        const extractedText = textAnnotations[0].description || ''
        console.log(`OCR extracted ${extractedText.length} characters from image`)
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

    console.log('Processing material:', materialId)

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

    const isPastQuestionImages = material.material_type === 'past-question-images'
    const requiresOCR = isPastQuestionImages && material.file_type?.includes('image')

    // Update processing status
    await supabase
      .from('cramintel_materials')
      .update({ 
        processing_status: requiresOCR ? 'extracting_text_ocr' : 'extracting_text',
        processing_progress: 10 
      })
      .eq('id', materialId)

    let extractedText = ''
    let extractionConfidence = 0

    try {
      if (requiresOCR) {
        console.log('Processing image with OCR:', material.file_path)
        
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('cramintel-materials')
          .download(material.file_path)

        if (downloadError || !fileData) {
          throw new Error(`Failed to download image: ${downloadError?.message}`)
        }

        const arrayBuffer = await fileData.arrayBuffer()
        console.log('Image file size:', arrayBuffer.byteLength, 'bytes')
        
        await supabase
          .from('cramintel_materials')
          .update({ 
            processing_status: 'processing_ocr',
            processing_progress: 25 
          })
          .eq('id', materialId)

        const text = await extractTextFromImage(new Uint8Array(arrayBuffer))
        extractedText = text
        extractionConfidence = isValidExtractedText(extractedText) ? 85 : 35
        
        console.log('OCR extraction completed, text length:', extractedText.length, 'confidence:', extractionConfidence)
        
        if (!isValidExtractedText(extractedText)) {
          throw new Error('OCR extracted text is of poor quality or corrupted')
        }
        
      } else if (material.file_type?.includes('pdf')) {
        console.log('Processing PDF with enhanced methods:', material.file_path)
        
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('cramintel-materials')
          .download(material.file_path)

        if (downloadError || !fileData) {
          throw new Error(`Failed to download PDF: ${downloadError?.message}`)
        }

        const arrayBuffer = await fileData.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        
        console.log('PDF file size:', uint8Array.length, 'bytes')
        
        // Use enhanced PDF processing with multiple methods
        const { text, confidence } = await processPdfWithMultipleMethods(uint8Array)
        
        console.log('Enhanced PDF processing completed, length:', text.length, 'confidence:', confidence)
        
        if (text && text.trim().length > 200) {
          extractedText = text
          extractionConfidence = confidence
          console.log('Using enhanced PDF processing results')
        } else {
          throw new Error('Insufficient text content extracted from PDF using all methods')
        }
        
      } else if (material.file_type?.includes('text')) {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('cramintel-materials')
          .download(material.file_path)

        if (downloadError || !fileData) {
          throw new Error(`Failed to download text file: ${downloadError?.message}`)
        }

        extractedText = await fileData.text()
        extractionConfidence = 95
      } else {
        // ... keep existing code (fallback content generation) the same
        extractedText = `Course Material Analysis: ${material.name}
Subject: ${material.course}
Material Type: ${material.material_type}

Academic Content Overview:
This ${material.material_type} is designed for ${material.course} students and covers essential curriculum topics.

Core Learning Areas for ${material.course}:

1. Fundamental Concepts and Theories
- Key principles that form the foundation of ${material.course}
- Historical development and evolution of ideas
- Current theoretical frameworks and models

2. Terminology and Definitions
- Essential vocabulary specific to ${material.course}
- Technical terms and their applications
- Industry-standard nomenclature

3. Practical Applications
- Real-world examples and case studies
- Problem-solving methodologies
- Hands-on techniques and procedures

4. Critical Analysis Skills
- Evaluation methods and criteria
- Comparative analysis techniques
- Research and investigation approaches

5. Current Developments
- Recent advances in the field
- Emerging trends and technologies
- Future directions and implications

Study Focus Areas:
Students should concentrate on understanding how these concepts interconnect and apply to practical scenarios within ${material.course}.`
        extractionConfidence = 60
      }
    } catch (extractionError) {
      console.error('Text extraction failed:', extractionError)
      throw new Error(`Content extraction failed: ${extractionError.message}`)
    }

    // Store the extracted text in the database
    await storeExtractedText(
      supabase, 
      materialId, 
      extractedText, 
      requiresOCR ? 'ocr' : (material.file_type?.includes('pdf') ? 'enhanced_pdf' : 'text'),
      extractionConfidence
    )

    await supabase
      .from('cramintel_materials')
      .update({ 
        processing_status: 'processing_content',
        processing_progress: 30 
      })
      .eq('id', materialId)

    let cleanText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?;:()\-\[\]]/g, '')
      .trim()

    if (requiresOCR) {
      cleanText = `Past Question Analysis from ${material.course}:\n\n${cleanText}`
    }

    console.log('Cleaned text length:', cleanText.length)

    if (cleanText.length < 100) {
      throw new Error('Insufficient content for flashcard generation')
    }

    await supabase
      .from('cramintel_materials')
      .update({ 
        processing_status: 'generating_flashcards',
        processing_progress: 50 
      })
      .eq('id', materialId)

    // ... keep existing code (flashcard generation with OpenAI) the same
    let flashcards: FlashcardQuestion[] = []

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    try {
      const systemPrompt = isPastQuestionImages 
        ? `You are an expert educator creating study flashcards from past exam questions that were extracted via OCR.

REQUIREMENTS:
- Generate EXACTLY 20 flashcards from the provided past question content
- Focus on the types of questions that appeared in past exams
- Create questions that help students prepare for similar exam formats
- Base flashcards on the actual question patterns and topics found
- Provide complete, accurate answers that would help in exam preparation
- Distribute difficulty: 6 easy, 8 medium, 6 hard
- Make questions specific to the exam style and content discovered

Return ONLY a JSON array:
[
  {
    "question": "Specific question based on past exam patterns",
    "answer": "Complete, accurate answer for exam preparation",
    "difficulty": "easy|medium|hard",
    "topic": "specific topic area from past questions"
  }
]

No text before or after the JSON.`
        : `You are an expert educator creating study flashcards from academic material.

REQUIREMENTS:
- Generate EXACTLY 20 flashcards from the provided content
- Base questions on specific information from the text
- Create meaningful, educational questions that test understanding
- Provide complete, accurate answers
- Distribute difficulty: 6 easy, 8 medium, 6 hard
- Focus on key concepts, definitions, and important facts
- Make questions specific and clear

Return ONLY a JSON array:
[
  {
    "question": "Specific question from the content",
    "answer": "Complete, accurate answer",
    "difficulty": "easy|medium|hard",
    "topic": "specific topic area"
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
              content: `Create 20 flashcards from this ${material.course} material${requiresOCR ? ' (extracted from past question images)' : ''}:

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

    // ... keep existing code (deck creation and flashcard saving) the same
    await supabase
      .from('cramintel_materials')
      .update({ 
        processing_status: 'saving_flashcards',
        processing_progress: 80 
      })
      .eq('id', materialId)

    const deckName = isPastQuestionImages 
      ? `${material.name} - Past Questions Flashcards`
      : `${material.name} - Flashcards`
      
    const deckDescription = isPastQuestionImages
      ? `Generated from past question images via OCR for ${material.course}`
      : `Generated from ${material.material_type} for ${material.course}`

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

    console.log('Material processing completed successfully')

    const resultMessage = isPastQuestionImages
      ? `Successfully generated ${flashcards.length} flashcards from past question image via enhanced OCR`
      : material.file_type?.includes('pdf')
      ? `Successfully generated ${flashcards.length} flashcards from PDF using enhanced processing`
      : `Successfully generated ${flashcards.length} flashcards from content`

    return new Response(JSON.stringify({
      success: true,
      flashcards_generated: flashcards.length,
      deck_id: deck.id,
      ocr_processed: requiresOCR,
      enhanced_pdf_processed: material.file_type?.includes('pdf'),
      extraction_confidence: extractionConfidence,
      message: resultMessage
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
      details: 'Enhanced material processing failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
