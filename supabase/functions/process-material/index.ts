
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

// Direct PDF processing with Google Vision API
async function extractTextFromPdf(pdfBuffer: Uint8Array, fileName: string): Promise<{ success: boolean; text: string; error?: string }> {
  const googleVisionApiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY');
  if (!googleVisionApiKey) {
    throw new Error('Google Vision API key not configured');
  }

  console.log(`Processing PDF directly with Google Vision: ${fileName} (${(pdfBuffer.byteLength / 1024 / 1024).toFixed(2)}MB)`);

  try {
    const base64Data = arrayBufferToBase64(pdfBuffer.buffer);
    
    if (!base64Data || base64Data.length < 100) {
      return {
        success: false,
        text: '',
        error: 'Invalid or empty PDF data'
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
        error: `Google Vision API error: ${response.status} - ${errorText}`
      };
    }

    const result = await response.json();
    console.log('Google Vision API response received');
    
    if (result.responses && result.responses[0]) {
      const responseData = result.responses[0];
      
      if (responseData.error) {
        return {
          success: false,
          text: '',
          error: `Google Vision API error: ${responseData.error.message}`
        };
      }
      
      // Extract text from document text detection
      if (responseData.fullTextAnnotation && responseData.fullTextAnnotation.text) {
        const extractedText = responseData.fullTextAnnotation.text.trim();
        if (extractedText.length > 50) {
          console.log(`✅ Successfully extracted ${extractedText.length} characters from PDF`);
          return {
            success: true,
            text: extractedText
          };
        }
      }
      
      // Fallback to regular text detection
      const textAnnotations = responseData.textAnnotations;
      if (textAnnotations && textAnnotations.length > 0) {
        const extractedText = textAnnotations[0].description?.trim() || '';
        if (extractedText.length > 50) {
          console.log(`✅ Extracted ${extractedText.length} characters using fallback method`);
          return {
            success: true,
            text: extractedText
          };
        }
      }
    }
    
    return {
      success: false,
      text: '',
      error: 'No readable text found in PDF'
    };
    
  } catch (error) {
    console.error(`PDF processing failed:`, error);
    return {
      success: false,
      text: '',
      error: `PDF processing failed: ${error.message}`
    };
  }
}

// Process image files
async function extractTextFromImage(imageBuffer: Uint8Array, fileName: string): Promise<{ success: boolean; text: string; error?: string }> {
  const googleVisionApiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY');
  if (!googleVisionApiKey) {
    throw new Error('Google Vision API key not configured');
  }

  console.log(`Processing image with Google Vision: ${fileName}`);

  try {
    const base64Data = arrayBufferToBase64(imageBuffer.buffer);
    
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
      return {
        success: false,
        text: '',
        error: `Google Vision API error: ${response.status} - ${errorText}`
      };
    }

    const result = await response.json();
    
    if (result.responses && result.responses[0]) {
      const responseData = result.responses[0];
      
      if (responseData.error) {
        return {
          success: false,
          text: '',
          error: `Google Vision API error: ${responseData.error.message}`
        };
      }
      
      if (responseData.fullTextAnnotation && responseData.fullTextAnnotation.text) {
        const extractedText = responseData.fullTextAnnotation.text.trim();
        console.log(`✅ Successfully extracted ${extractedText.length} characters from image`);
        return {
          success: true,
          text: extractedText
        };
      }
    }
    
    return {
      success: false,
      text: '',
      error: 'No readable text found in image'
    };
    
  } catch (error) {
    console.error(`Image processing failed:`, error);
    return {
      success: false,
      text: '',
      error: `Image processing failed: ${error.message}`
    };
  }
}

// Function to validate text quality
function isValidExtractedText(text: string): boolean {
  if (!text || text.trim().length < 50) return false;
  
  const repeatedPattern = /(.)\1{10,}/g;
  const excessiveNumbers = /\d{20,}/g;
  const meaninglessPattern = /^[^a-zA-Z]*$/;
  
  if (repeatedPattern.test(text) || excessiveNumbers.test(text) || meaninglessPattern.test(text.slice(0, 100))) {
    return false;
  }
  
  const words = text.split(/\s+/).filter(word => word.length > 2);
  const uniqueChars = new Set(text.toLowerCase().split(''));
  
  return words.length >= 10 && uniqueChars.size >= 15;
}

// Function to store extracted text
async function storeExtractedText(supabase: any, materialId: string, text: string, method: string, confidence?: number) {
  const wordCount = text.split(/\s+/).length;
  const characterCount = text.length;
  
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
    });

  if (error) {
    console.error('Error storing extracted text:', error);
  } else {
    console.log('Successfully stored extracted text for material:', materialId);
  }
  
  return { data, error };
}

// Chunked base64 conversion to prevent stack overflow for large files
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192;
  let binary = '';
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let requestBody: any;
  try {
    requestBody = await req.json();
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { materialId } = requestBody;

    if (!materialId) {
      return new Response(JSON.stringify({ error: 'Material ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing material with direct PDF approach:', materialId);

    // Get material details
    const { data: material, error: materialError } = await supabase
      .from('cramintel_materials')
      .select('*')
      .eq('id', materialId)
      .eq('user_id', user.id)
      .single();

    if (materialError || !material) {
      console.error('Material not found:', materialError);
      return new Response(JSON.stringify({ error: 'Material not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update processing status
    await supabase
      .from('cramintel_materials')
      .update({ 
        processing_status: 'processing_ocr',
        processing_progress: 10 
      })
      .eq('id', materialId);

    let extractedText = '';
    let extractionConfidence = 0;
    let processingMethod = '';

    try {
      // Download the file
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('cramintel-materials')
        .download(material.file_path);

      if (downloadError || !fileData) {
        throw new Error(`Failed to download file: ${downloadError?.message}`);
      }

      const arrayBuffer = await fileData.arrayBuffer();
      const fileBuffer = new Uint8Array(arrayBuffer);
      console.log('File downloaded successfully, size:', fileBuffer.length, 'bytes');
      
      await supabase
        .from('cramintel_materials')
        .update({ 
          processing_status: 'extracting_text',
          processing_progress: 30 
        })
        .eq('id', materialId);

      // Process different file types with direct Google Vision
      if (material.file_type?.includes('pdf')) {
        console.log('Processing PDF with direct Google Vision API');
        const result = await extractTextFromPdf(fileBuffer, material.name);
        
        if (result.success) {
          extractedText = result.text;
          extractionConfidence = isValidExtractedText(extractedText) ? 90 : 50;
          processingMethod = 'direct_pdf_vision';
          console.log(`✅ PDF processed successfully: ${extractedText.length} characters`);
        } else {
          throw new Error(result.error || 'PDF processing failed');
        }
        
      } else if (material.file_type?.includes('image')) {
        console.log('Processing image file with Google Vision API');
        const result = await extractTextFromImage(fileBuffer, material.name);
        
        if (result.success) {
          extractedText = result.text;
          extractionConfidence = isValidExtractedText(extractedText) ? 90 : 50;
          processingMethod = 'direct_image_vision';
          console.log(`✅ Image processed successfully: ${extractedText.length} characters`);
        } else {
          throw new Error(result.error || 'Image processing failed');
        }
        
      } else if (material.file_type?.includes('text')) {
        console.log('Processing text file directly');
        extractedText = new TextDecoder().decode(fileBuffer);
        extractionConfidence = 95;
        processingMethod = 'direct_text';
        console.log(`✅ Text file processed: ${extractedText.length} characters`);
        
      } else {
        // Default: treat as text
        console.log('Unknown file type, treating as text');
        extractedText = new TextDecoder().decode(fileBuffer);
        extractionConfidence = 75;
        processingMethod = 'direct_text_fallback';
      }

      if (!extractedText || extractedText.trim().length < 50) {
        throw new Error('Insufficient content extracted from document');
      }

      console.log(`✅ Text extraction completed: ${extractedText.length} characters, confidence: ${extractionConfidence}%`);
      
    } catch (extractionError) {
      console.error('Direct processing failed:', extractionError);
      throw new Error(`Processing failed: ${extractionError.message}`);
    }

    // Store the extracted text in the database
    await storeExtractedText(
      supabase, 
      materialId, 
      extractedText, 
      processingMethod,
      extractionConfidence
    );

    await supabase
      .from('cramintel_materials')
      .update({ 
        processing_status: 'processing_content',
        processing_progress: 60 
      })
      .eq('id', materialId);

    let cleanText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?;:()\-\[\]]/g, '')
      .trim();

    console.log('Cleaned text length:', cleanText.length);

    if (cleanText.length < 100) {
      throw new Error('Insufficient content for flashcard generation');
    }

    await supabase
      .from('cramintel_materials')
      .update({ 
        processing_status: 'generating_flashcards',
        processing_progress: 80 
      })
      .eq('id', materialId);

    // Generate flashcards with OpenAI
    let flashcards: FlashcardQuestion[] = [];

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const systemPrompt = `You are an expert educator creating study flashcards from document content.

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

No text before or after the JSON.`;

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
Title: ${material.name}
Processing: Direct Vision API Processing`
            }
          ],
          temperature: 0.3,
          max_tokens: 4000,
        }),
      });

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error('OpenAI API error:', errorText);
        throw new Error(`OpenAI API failed: ${openaiResponse.status}`);
      }

      const openaiData = await openaiResponse.json();
      const flashcardsContent = openaiData.choices[0]?.message?.content;

      if (!flashcardsContent) {
        throw new Error('No flashcards received from OpenAI');
      }

      flashcards = JSON.parse(flashcardsContent);
      
      if (!Array.isArray(flashcards) || flashcards.length !== 20) {
        console.warn(`Expected 20 flashcards, got ${flashcards.length}`);
        if (flashcards.length < 20) {
          while (flashcards.length < 20) {
            const randomCard = flashcards[Math.floor(Math.random() * flashcards.length)];
            flashcards.push({ ...randomCard });
          }
        } else {
          flashcards = flashcards.slice(0, 20);
        }
      }

      console.log(`Successfully generated ${flashcards.length} flashcards using OpenAI`);
    } catch (openaiError) {
      console.error('OpenAI processing failed:', openaiError);
      throw new Error(`Flashcard generation failed: ${openaiError.message}`);
    }

    await supabase
      .from('cramintel_materials')
      .update({ 
        processing_status: 'saving_flashcards',
        processing_progress: 90 
      })
      .eq('id', materialId);

    const deckName = `${material.name} - Flashcards`;
    const deckDescription = `Generated from direct Vision API processing for ${material.course}`;

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
      .single();

    if (deckError) {
      console.error('Error creating deck:', deckError);
      throw new Error('Failed to create flashcard deck');
    }

    const flashcardInserts = flashcards.map(card => ({
      question: card.question,
      answer: card.answer,
      course: material.course,
      difficulty_level: card.difficulty || 'medium',
      material_id: materialId,
      user_id: user.id
    }));

    const { data: savedFlashcards, error: flashcardError } = await supabase
      .from('cramintel_flashcards')
      .insert(flashcardInserts)
      .select();

    if (flashcardError) {
      console.error('Error saving flashcards:', flashcardError);
      throw new Error('Failed to save flashcards');
    }

    const deckFlashcardInserts = savedFlashcards.map(flashcard => ({
      deck_id: deck.id,
      flashcard_id: flashcard.id
    }));

    const { error: linkError } = await supabase
      .from('cramintel_deck_flashcards')
      .insert(deckFlashcardInserts);

    if (linkError) {
      console.error('Error linking flashcards:', linkError);
    }

    await supabase
      .from('cramintel_materials')
      .update({ 
        processed: true,
        processing_status: 'completed',
        processing_progress: 100 
      })
      .eq('id', materialId);

    console.log('Material processing completed successfully with direct Vision API approach');

    return new Response(JSON.stringify({
      success: true,
      flashcards_generated: flashcards.length,
      deck_id: deck.id,
      direct_processing: true,
      extraction_confidence: extractionConfidence,
      processing_method: processingMethod,
      text_length: extractedText.length,
      message: `Successfully generated ${flashcards.length} flashcards using direct Vision API processing`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in direct process-material function:', error);
    
    try {
      const { materialId } = requestBody;
      if (materialId) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        await supabase
          .from('cramintel_materials')
          .update({ 
            processing_status: 'error',
            processing_progress: 0 
          })
          .eq('id', materialId);
      }
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }

    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Direct Vision API material processing failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
