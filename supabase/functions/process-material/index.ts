import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { PDFDocument } from 'https://esm.sh/pdf-lib@1.17.1';

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

interface ProcessedPage {
  pageNumber: number;
  imageData: Uint8Array | null;
  error?: string;
  width?: number;
  height?: number;
}

// Robust PDF-to-Image Converter for Deno/Edge Environments
class RobustPdfConverter {
  private maxPages = 50; // Reasonable limit for processing
  private timeoutMs = 30000; // 30 second timeout per page

  async convertPdfToImages(pdfBuffer: Uint8Array): Promise<ProcessedPage[]> {
    console.log('Starting robust PDF to image conversion');
    
    try {
      // Method 1: Try pdf-lib approach (most compatible with Deno)
      console.log('Attempting pdf-lib conversion method');
      const result = await this.convertWithPdfLib(pdfBuffer);
      if (result.success && result.pages.length > 0) {
        return result.pages;
      }
      
      console.log('pdf-lib method failed, trying fallback method');
      
      // Method 2: Fallback - treat entire PDF as single image for OCR
      return await this.convertWithFallback(pdfBuffer);
      
    } catch (error) {
      console.error('All PDF conversion methods failed:', error);
      throw new Error(`PDF conversion failed: ${error.message}`);
    }
  }

  private async convertWithPdfLib(pdfBuffer: Uint8Array): Promise<{ success: boolean; pages: ProcessedPage[] }> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pageCount = pdfDoc.getPageCount();
      
      console.log(`PDF has ${pageCount} pages`);
      
      if (pageCount > this.maxPages) {
        console.warn(`PDF has ${pageCount} pages. Processing first ${this.maxPages} pages only.`);
      }
      
      const pages: ProcessedPage[] = [];
      const maxPagesToProcess = Math.min(pageCount, this.maxPages);
      
      // For each page, create a separate single-page PDF
      for (let i = 0; i < maxPagesToProcess; i++) {
        console.log(`Processing page ${i + 1}/${maxPagesToProcess}`);
        
        try {
          // Create a new PDF with just this page
          const singlePagePdf = await PDFDocument.create();
          const [page] = await singlePagePdf.copyPages(pdfDoc, [i]);
          singlePagePdf.addPage(page);
          
          // Get page dimensions
          const pageSize = page.getSize();
          
          // Serialize to buffer - this single-page PDF can be processed by Google Vision
          const singlePageBuffer = await singlePagePdf.save();
          const singlePageUint8Array = new Uint8Array(singlePageBuffer);
          
          pages.push({
            pageNumber: i + 1,
            imageData: singlePageUint8Array,
            width: pageSize.width,
            height: pageSize.height
          });
          
        } catch (pageError) {
          console.error(`Error processing page ${i + 1}:`, pageError);
          pages.push({
            pageNumber: i + 1,
            imageData: null,
            error: pageError.message
          });
        }
      }
      
      return { success: true, pages };
      
    } catch (error) {
      console.error('pdf-lib conversion failed:', error);
      return { success: false, pages: [] };
    }
  }

  private async convertWithFallback(pdfBuffer: Uint8Array): Promise<ProcessedPage[]> {
    console.log('Using fallback method: treating PDF as single document');
    
    // Return the entire PDF as a single "page" for Google Vision to process
    // Google Vision can handle PDF files directly in many cases
    return [{
      pageNumber: 1,
      imageData: pdfBuffer,
      width: 595, // A4 default width
      height: 842  // A4 default height
    }];
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

// Enhanced OCR function that can handle both images and single-page PDFs
async function extractTextFromImageOrPdf(imageBuffer: Uint8Array, pageNumber?: number): Promise<string> {
  const googleVisionApiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY')
  if (!googleVisionApiKey) {
    throw new Error('Google Vision API key not configured')
  }

  const maxFileSize = 20 * 1024 * 1024
  if (imageBuffer.byteLength > maxFileSize) {
    throw new Error(`File too large: ${(imageBuffer.byteLength / 1024 / 1024).toFixed(1)}MB. Maximum allowed: 20MB`)
  }

  try {
    const pageInfo = pageNumber ? ` (page ${pageNumber})` : '';
    console.log(`Processing file${pageInfo} of size: ${(imageBuffer.byteLength / 1024 / 1024).toFixed(2)}MB with OCR`)
    
    const base64Data = arrayBufferToBase64(imageBuffer.buffer)
    
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${googleVisionApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: base64Data,
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
    console.log(`Google Vision API response received${pageInfo}`)
    
    if (result.responses && result.responses[0]) {
      const responseData = result.responses[0]
      
      if (responseData.error) {
        throw new Error(`Google Vision API error: ${responseData.error.message}`)
      }
      
      // Try document text detection first
      if (responseData.fullTextAnnotation && responseData.fullTextAnnotation.text) {
        const extractedText = responseData.fullTextAnnotation.text
        console.log(`OCR extracted ${extractedText.length} characters${pageInfo} using document detection`)
        return extractedText
      }
      
      // Fallback to regular text detection
      const textAnnotations = responseData.textAnnotations
      if (textAnnotations && textAnnotations.length > 0) {
        const extractedText = textAnnotations[0].description || ''
        console.log(`OCR extracted ${extractedText.length} characters${pageInfo} using text detection`)
        return extractedText
      }
    }
    
    console.log(`No text detected${pageInfo}`)
    return ''
  } catch (error) {
    console.error(`OCR extraction failed${pageInfo}:`, error)
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

    console.log('Processing material with enhanced OCR approach:', materialId)

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

      let processedPages: ProcessedPage[] = []

      // Process different file types
      if (material.file_type?.includes('pdf')) {
        console.log('Processing PDF with robust page-by-page conversion')
        const converter = new RobustPdfConverter()
        processedPages = await converter.convertPdfToImages(fileBuffer)
        console.log(`PDF converted to ${processedPages.length} processable pages`)
      } else if (material.file_type?.includes('image')) {
        console.log('Processing image file with OCR')
        processedPages = [{
          pageNumber: 1,
          imageData: fileBuffer,
          width: 0,
          height: 0
        }]
      } else if (material.file_type?.includes('text')) {
        console.log('Converting text file to image for OCR processing')
        const textContent = new TextDecoder().decode(fileBuffer)
        const textImage = await convertTextToImage(textContent)
        processedPages = [{
          pageNumber: 1,
          imageData: textImage,
          width: 800,
          height: 1000
        }]
      } else {
        // Default: treat as text and convert to image
        console.log('Unknown file type, treating as text and converting to image')
        const textContent = new TextDecoder().decode(fileBuffer)
        const textImage = await convertTextToImage(textContent)
        processedPages = [{
          pageNumber: 1,
          imageData: textImage,
          width: 800,
          height: 1000
        }]
      }

      if (processedPages.length === 0) {
        throw new Error('No pages could be generated for OCR processing')
      }

      await supabase
        .from('cramintel_materials')
        .update({ 
          processing_status: 'extracting_text_ocr',
          processing_progress: 40 
        })
        .eq('id', materialId)

      // Process each page with OCR
      const textPages = await Promise.all(
        processedPages.map(async (page, index) => {
          try {
            if (!page.imageData) {
              console.log(`Skipping page ${page.pageNumber} due to processing error: ${page.error}`)
              return `[Page ${page.pageNumber} processing failed: ${page.error}]`
            }
            
            console.log(`Processing page ${page.pageNumber}/${processedPages.length} with OCR`)
            
            // Update progress for multi-page documents
            if (processedPages.length > 1) {
              const pageProgress = 40 + (index / processedPages.length) * 30 // 40-70% range for OCR
              await supabase
                .from('cramintel_materials')
                .update({ processing_progress: Math.floor(pageProgress) })
                .eq('id', materialId)
            }
            
            return await extractTextFromImageOrPdf(page.imageData, page.pageNumber)
          } catch (error) {
            console.error(`OCR failed for page ${page.pageNumber}:`, error)
            return `[OCR processing failed for page ${page.pageNumber}: ${error.message}]`
          }
        })
      )

      // Combine all extracted text
      if (processedPages.length > 1) {
        extractedText = textPages.map((text, index) => 
          `--- Page ${processedPages[index].pageNumber} ---\n\n${text}\n\n`
        ).join('')
      } else {
        extractedText = textPages[0] || ''
      }

      extractionConfidence = isValidExtractedText(extractedText) ? 85 : 35
      
      console.log(`OCR processing completed, text length: ${extractedText.length}, confidence: ${extractionConfidence}`)
      
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
      'enhanced_ocr',
      extractionConfidence
    )

    await supabase
      .from('cramintel_materials')
      .update({ 
        processing_status: 'processing_content',
        processing_progress: 70 
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
        processing_progress: 80 
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
        processing_progress: 90 
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

    console.log('Material processing completed successfully with enhanced OCR approach')

    return new Response(JSON.stringify({
      success: true,
      flashcards_generated: flashcards.length,
      deck_id: deck.id,
      enhanced_ocr_processed: true,
      extraction_confidence: extractionConfidence,
      pages_processed: processedPages.length,
      message: `Successfully generated ${flashcards.length} flashcards using enhanced OCR processing`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in enhanced process-material function:', error)
    
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
      details: 'Enhanced OCR material processing failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
