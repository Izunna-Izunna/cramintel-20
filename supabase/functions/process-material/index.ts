import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { extractText, getDocumentProxy } from "npm:unpdf@1.0.5";

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

// OCR function using Google Vision API
async function extractTextFromImage(imageBuffer: ArrayBuffer): Promise<string> {
  const googleVisionApiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY');
  if (!googleVisionApiKey) {
    throw new Error('Google Vision API key not configured');
  }

  try {
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    
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
    });

    if (!response.ok) {
      throw new Error(`Google Vision API error: ${response.status}`);
    }

    const result = await response.json();
    const textAnnotations = result.responses[0]?.textAnnotations;
    
    if (textAnnotations && textAnnotations.length > 0) {
      return textAnnotations[0].description || '';
    }
    
    return '';
  } catch (error) {
    console.error('OCR extraction failed:', error);
    throw new Error(`OCR processing failed: ${error.message}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    const { materialId } = await req.json();

    if (!materialId) {
      return new Response(JSON.stringify({ error: 'Material ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing material:', materialId);

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

    const isPastQuestionImages = material.material_type === 'past-question-images';
    const requiresOCR = isPastQuestionImages && material.file_type?.includes('image');

    // Update processing status
    await supabase
      .from('cramintel_materials')
      .update({ 
        processing_status: requiresOCR ? 'extracting_text_ocr' : 'extracting_text',
        processing_progress: 10 
      })
      .eq('id', materialId);

    let extractedText = '';

    try {
      if (requiresOCR) {
        console.log('Processing image with OCR:', material.file_path);
        
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('cramintel-materials')
          .download(material.file_path);

        if (downloadError || !fileData) {
          throw new Error(`Failed to download image: ${downloadError?.message}`);
        }

        const arrayBuffer = await fileData.arrayBuffer();
        console.log('Image file size:', arrayBuffer.byteLength, 'bytes');
        
        // Update progress for OCR processing
        await supabase
          .from('cramintel_materials')
          .update({ 
            processing_status: 'processing_ocr',
            processing_progress: 25 
          })
          .eq('id', materialId);

        extractedText = await extractTextFromImage(arrayBuffer);
        console.log('OCR extraction completed, text length:', extractedText.length);
        
        if (extractedText && extractedText.trim().length > 50) {
          console.log('Using OCR extracted text for processing');
        } else {
          throw new Error('Insufficient text content extracted from image via OCR');
        }
        
      } else if (material.file_type?.includes('pdf')) {
        console.log('Extracting text from PDF:', material.file_path);
        
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('cramintel-materials')
          .download(material.file_path);

        if (downloadError || !fileData) {
          throw new Error(`Failed to download PDF: ${downloadError?.message}`);
        }

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
        
      } else if (material.file_type?.includes('text')) {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('cramintel-materials')
          .download(material.file_path);

        if (downloadError || !fileData) {
          throw new Error(`Failed to download text file: ${downloadError?.message}`);
        }

        extractedText = await fileData.text();
      } else {
        // Better fallback for non-text files
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
Students should concentrate on understanding how these concepts interconnect and apply to practical scenarios within ${material.course}.`;
      }
    } catch (extractionError) {
      console.error('Text extraction failed:', extractionError);
      throw new Error(`Content extraction failed: ${extractionError.message}`);
    }

    // Update processing status
    await supabase
      .from('cramintel_materials')
      .update({ 
        processing_status: 'processing_content',
        processing_progress: 30 
      })
      .eq('id', materialId);

    // Clean text with special handling for OCR text
    let cleanText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?;:()\-\[\]]/g, '')
      .trim();

    // For OCR text, add some context about the source
    if (requiresOCR) {
      cleanText = `Past Question Analysis from ${material.course}:\n\n${cleanText}`;
    }

    console.log('Cleaned text length:', cleanText.length);

    if (cleanText.length < 100) {
      throw new Error('Insufficient content for flashcard generation');
    }

    // Update processing status
    await supabase
      .from('cramintel_materials')
      .update({ 
        processing_status: 'generating_flashcards',
        processing_progress: 50 
      })
      .eq('id', materialId);

    // Generate flashcards using OpenAI
    let flashcards: FlashcardQuestion[] = [];

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
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

    // Update processing status
    await supabase
      .from('cramintel_materials')
      .update({ 
        processing_status: 'saving_flashcards',
        processing_progress: 80 
      })
      .eq('id', materialId);

    // Create deck and save flashcards
    const deckName = isPastQuestionImages 
      ? `${material.name} - Past Questions Flashcards`
      : `${material.name} - Flashcards`;
      
    const deckDescription = isPastQuestionImages
      ? `Generated from past question images via OCR for ${material.course}`
      : `Generated from ${material.material_type} for ${material.course}`;

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

    // Save flashcards
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

    // Link flashcards to deck
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

    // Mark as completed
    await supabase
      .from('cramintel_materials')
      .update({ 
        processed: true,
        processing_status: 'completed',
        processing_progress: 100 
      })
      .eq('id', materialId);

    console.log('Material processing completed successfully');

    const resultMessage = isPastQuestionImages
      ? `Successfully generated ${flashcards.length} flashcards from past question image via OCR`
      : `Successfully generated ${flashcards.length} flashcards from content`;

    return new Response(JSON.stringify({
      success: true,
      flashcards_generated: flashcards.length,
      deck_id: deck.id,
      ocr_processed: requiresOCR,
      message: resultMessage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-material function:', error);
    
    try {
      const { materialId } = await req.json();
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
      details: 'Material processing failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
