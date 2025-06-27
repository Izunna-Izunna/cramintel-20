
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

interface OCRResult {
  success: boolean;
  text: string;
  method: string;
  pageNumber: number;
  confidence?: string;
  error?: string;
}

// Enhanced OCR function with proper error handling
async function extractTextFromImageOrPdf(imageBuffer: Uint8Array, pageNumber = 1, fileName = 'unknown', totalPages = 1): Promise<OCRResult> {
  const googleVisionApiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY')
  if (!googleVisionApiKey) {
    throw new Error('Google Vision API key not configured')
  }

  // Create pageInfo object to prevent undefined errors
  const pageInfo = {
    current: pageNumber,
    total: totalPages,
    fileName: fileName
  };

  console.log(`Starting OCR processing for page ${pageInfo.current}/${pageInfo.total} of ${pageInfo.fileName}`);

  const maxFileSize = 20 * 1024 * 1024
  if (imageBuffer.byteLength > maxFileSize) {
    return {
      success: false,
      text: '',
      method: 'error',
      pageNumber,
      error: `File too large: ${(imageBuffer.byteLength / 1024 / 1024).toFixed(1)}MB. Maximum allowed: 20MB`
    };
  }

  try {
    console.log(`Processing page ${pageInfo.current} with OCR (size: ${(imageBuffer.byteLength / 1024 / 1024).toFixed(2)}MB)`);
    
    const base64Data = arrayBufferToBase64(imageBuffer.buffer);
    
    // Validate base64 data
    if (!base64Data || base64Data.length < 100) {
      return {
        success: false,
        text: '',
        method: 'error',
        pageNumber,
        error: `Invalid or empty base64 data for page ${pageNumber}`
      };
    }
    
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
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Vision API error response:', errorText);
      return {
        success: false,
        text: '',
        method: 'error',
        pageNumber,
        error: `Google Vision API error: ${response.status} - ${errorText}`
      };
    }

    const result = await response.json();
    console.log(`Google Vision API response received for page ${pageInfo.current}`);
    
    if (result.responses && result.responses[0]) {
      const responseData = result.responses[0];
      
      if (responseData.error) {
        return {
          success: false,
          text: '',
          method: 'error',
          pageNumber,
          error: `Google Vision API error: ${responseData.error.message}`
        };
      }
      
      // Try document text detection first
      if (responseData.fullTextAnnotation && responseData.fullTextAnnotation.text) {
        const extractedText = responseData.fullTextAnnotation.text.trim();
        if (extractedText.length > 10) {
          console.log(`✓ Document text detection successful for page ${pageInfo.current} (${extractedText.length} characters)`);
          return {
            success: true,
            text: extractedText,
            method: 'document_text_detection',
            pageNumber,
            confidence: 'high'
          };
        }
      }
      
      // Fallback to regular text detection
      const textAnnotations = responseData.textAnnotations;
      if (textAnnotations && textAnnotations.length > 0) {
        const extractedText = textAnnotations[0].description?.trim() || '';
        if (extractedText.length > 10) {
          console.log(`✓ Text detection successful for page ${pageInfo.current} (${extractedText.length} characters)`);
          return {
            success: true,
            text: extractedText,
            method: 'text_detection',
            pageNumber,
            confidence: 'medium'
          };
        }
      }
    }
    
    console.log(`✗ No readable text found on page ${pageInfo.current}`);
    return {
      success: false,
      text: '',
      method: 'no_text',
      pageNumber,
      error: `No readable text found on page ${pageNumber}`
    };
    
  } catch (error) {
    console.error(`OCR processing failed for page ${pageNumber}:`, error);
    return {
      success: false,
      text: '',
      method: 'error',
      pageNumber,
      error: `OCR processing failed: ${error.message}`
    };
  }
}

// Enhanced PDF-to-Image Converter using pdf-lib
class EnhancedPdfConverter {
  private maxPages = 50;

  async convertPdfToImages(pdfBuffer: Uint8Array): Promise<ProcessedPage[]> {
    console.log('Starting enhanced PDF to image conversion');
    
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pageCount = pdfDoc.getPageCount();
      
      console.log(`PDF has ${pageCount} pages`);
      
      if (pageCount > this.maxPages) {
        console.warn(`PDF has ${pageCount} pages. Processing first ${this.maxPages} pages only.`);
      }
      
      const processedPages: ProcessedPage[] = [];
      const maxPagesToProcess = Math.min(pageCount, this.maxPages);
      
      // For each page, create a separate single-page PDF for OCR processing
      for (let i = 0; i < maxPagesToProcess; i++) {
        console.log(`Converting page ${i + 1}/${maxPagesToProcess} to processable format`);
        
        try {
          // Create a new PDF with just this page
          const singlePagePdf = await PDFDocument.create();
          const [page] = await singlePagePdf.copyPages(pdfDoc, [i]);
          singlePagePdf.addPage(page);
          
          // Get page dimensions
          const pageSize = page.getSize();
          
          // Serialize to buffer - this creates a single-page PDF that can be processed by Google Vision
          const singlePageBuffer = await singlePagePdf.save();
          const singlePageUint8Array = new Uint8Array(singlePageBuffer);
          
          processedPages.push({
            pageNumber: i + 1,
            imageData: singlePageUint8Array,
            width: pageSize.width,
            height: pageSize.height
          });
          
        } catch (pageError) {
          console.error(`Error processing page ${i + 1}:`, pageError);
          processedPages.push({
            pageNumber: i + 1,
            imageData: null,
            error: pageError.message
          });
        }
      }
      
      return processedPages;
      
    } catch (error) {
      console.error('Enhanced PDF conversion failed:', error);
      // Return single page with entire PDF as fallback
      return [{
        pageNumber: 1,
        imageData: pdfBuffer,
        width: 595,
        height: 842
      }];
    }
  }
}

// Enhanced multi-page PDF processing with proper error handling
async function processMultiPagePdf(pdfBuffer: Uint8Array, fileName: string): Promise<{ success: boolean; extractedText: string; totalPages: number; successfulPages: number; failedPages: number; error?: string }> {
  console.log(`Starting multi-page PDF processing for ${fileName}`);
  
  try {
    const converter = new EnhancedPdfConverter();
    const processedPages = await converter.convertPdfToImages(pdfBuffer);
    
    if (!processedPages || processedPages.length === 0) {
      throw new Error('No pages could be extracted from PDF');
    }

    console.log(`PDF converted to ${processedPages.length} processable pages`);

    const successfulResults: { pageNumber: number; text: string; method: string }[] = [];
    const failedPages: { pageNumber: number; error: string }[] = [];

    // Process each page individually with proper error handling
    for (const page of processedPages) {
      try {
        console.log(`Processing page ${page.pageNumber}/${processedPages.length}`);
        
        if (!page.imageData) {
          console.error(`No image data for page ${page.pageNumber}: ${page.error}`);
          failedPages.push({
            pageNumber: page.pageNumber,
            error: page.error || 'No image data available'
          });
          continue;
        }

        // Extract text from this page
        const result = await extractTextFromImageOrPdf(
          page.imageData, 
          page.pageNumber, 
          fileName, 
          processedPages.length
        );

        if (result.success && result.text.length > 10) {
          successfulResults.push({
            pageNumber: page.pageNumber,
            text: result.text,
            method: result.method
          });
          console.log(`✓ Page ${page.pageNumber} processed successfully (${result.text.length} chars)`);
        } else {
          failedPages.push({
            pageNumber: page.pageNumber,
            error: result.error || 'No text extracted'
          });
          console.log(`✗ Page ${page.pageNumber} failed: ${result.error}`);
        }

      } catch (pageError) {
        console.error(`Error processing page ${page.pageNumber}:`, pageError);
        failedPages.push({
          pageNumber: page.pageNumber,
          error: pageError.message
        });
      }
    }

    // Combine results from successful pages
    let combinedText = '';
    if (successfulResults.length > 1) {
      combinedText = successfulResults.map(page => 
        `--- Page ${page.pageNumber} ---\n\n${page.text}\n\n`
      ).join('');
    } else if (successfulResults.length === 1) {
      combinedText = successfulResults[0].text;
    }
    
    console.log(`PDF processing complete: ${successfulResults.length}/${processedPages.length} pages successful`);
    
    if (successfulResults.length === 0) {
      return {
        success: false,
        extractedText: '',
        totalPages: processedPages.length,
        successfulPages: 0,
        failedPages: failedPages.length,
        error: `No pages could be processed successfully. Failed pages: ${failedPages.length}`
      };
    }

    return {
      success: true,
      extractedText: combinedText,
      totalPages: processedPages.length,
      successfulPages: successfulResults.length,
      failedPages: failedPages.length
    };

  } catch (error) {
    console.error('Multi-page PDF processing failed:', error);
    return {
      success: false,
      extractedText: '',
      totalPages: 0,
      successfulPages: 0,
      failedPages: 0,
      error: `PDF processing failed: ${error.message}`
    };
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

    console.log('Processing material with fixed OCR approach:', materialId)

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
    let processingInfo = { method: '', totalPages: 0, successfulPages: 0, failedPages: 0 }

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

      // Process different file types with enhanced OCR
      if (material.file_type?.includes('pdf')) {
        console.log('Processing PDF with enhanced page-by-page OCR')
        const result = await processMultiPagePdf(fileBuffer, material.name)
        
        if (result.success) {
          extractedText = result.extractedText
          extractionConfidence = isValidExtractedText(extractedText) ? 85 : 35
          processingInfo = {
            method: 'enhanced_pdf_ocr',
            totalPages: result.totalPages,
            successfulPages: result.successfulPages,
            failedPages: result.failedPages
          }
          console.log(`✅ PDF processed successfully: ${result.successfulPages}/${result.totalPages} pages`)
        } else {
          throw new Error(result.error || 'PDF processing failed')
        }
        
      } else if (material.file_type?.includes('image')) {
        console.log('Processing image file with enhanced OCR')
        const result = await extractTextFromImageOrPdf(fileBuffer, 1, material.name, 1)
        
        if (result.success) {
          extractedText = result.text
          extractionConfidence = isValidExtractedText(extractedText) ? 85 : 35
          processingInfo = { method: 'enhanced_image_ocr', totalPages: 1, successfulPages: 1, failedPages: 0 }
          console.log(`✅ Image processed successfully`)
        } else {
          throw new Error(result.error || 'Image processing failed')
        }
        
      } else if (material.file_type?.includes('text')) {
        console.log('Converting text file to image for OCR processing')
        const textContent = new TextDecoder().decode(fileBuffer)
        const textImage = await convertTextToImage(textContent)
        const result = await extractTextFromImageOrPdf(textImage, 1, material.name, 1)
        
        if (result.success) {
          extractedText = result.text
          extractionConfidence = isValidExtractedText(extractedText) ? 85 : 35
          processingInfo = { method: 'text_to_image_ocr', totalPages: 1, successfulPages: 1, failedPages: 0 }
        } else {
          extractedText = textContent // Use original text as fallback
          extractionConfidence = 95
          processingInfo = { method: 'direct_text', totalPages: 1, successfulPages: 1, failedPages: 0 }
        }
      } else {
        // Default: treat as text and convert to image
        console.log('Unknown file type, treating as text and converting to image')
        const textContent = new TextDecoder().decode(fileBuffer)
        const textImage = await convertTextToImage(textContent)
        const result = await extractTextFromImageOrPdf(textImage, 1, material.name, 1)
        
        if (result.success) {
          extractedText = result.text
          extractionConfidence = isValidExtractedText(extractedText) ? 85 : 35
          processingInfo = { method: 'unknown_to_image_ocr', totalPages: 1, successfulPages: 1, failedPages: 0 }
        } else {
          extractedText = textContent // Use original text as fallback
          extractionConfidence = 75
          processingInfo = { method: 'direct_text_fallback', totalPages: 1, successfulPages: 1, failedPages: 0 }
        }
      }

      if (!extractedText || extractedText.trim().length < 50) {
        throw new Error('Insufficient content extracted from document')
      }

      console.log(`✅ Text extraction completed: ${extractedText.length} characters, confidence: ${extractionConfidence}%`)
      
    } catch (extractionError) {
      console.error('Enhanced OCR processing failed:', extractionError)
      throw new Error(`OCR processing failed: ${extractionError.message}`)
    }

    // Store the extracted text in the database
    await storeExtractedText(
      supabase, 
      materialId, 
      extractedText, 
      processingInfo.method,
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
Processing: Enhanced OCR Extraction
Pages Processed: ${processingInfo.successfulPages}/${processingInfo.totalPages}`
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

    const deckName = `${material.name} - Enhanced OCR Flashcards`
    const deckDescription = `Generated from enhanced OCR-processed content for ${material.course} (${processingInfo.successfulPages}/${processingInfo.totalPages} pages processed)`

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
      processing_info: processingInfo,
      message: `Successfully generated ${flashcards.length} flashcards using enhanced OCR processing (${processingInfo.successfulPages}/${processingInfo.totalPages} pages processed)`
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
