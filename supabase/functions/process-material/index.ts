
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { extractText } from "https://deno.land/x/unpdf@1.0.0/mod.ts";

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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Set the auth context
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

    // Update processing status to extracting_text
    await supabase
      .from('cramintel_materials')
      .update({ 
        processing_status: 'extracting_text',
        processing_progress: 10 
      })
      .eq('id', materialId);

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

    let extractedText = '';

    try {
      // Extract text based on file type
      if (material.file_type?.includes('pdf')) {
        console.log('Extracting text from PDF:', material.file_path);
        
        // Download the PDF file from storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('cramintel-materials')
          .download(material.file_path);

        if (downloadError || !fileData) {
          throw new Error(`Failed to download PDF: ${downloadError?.message}`);
        }

        // Convert to ArrayBuffer and extract text
        const arrayBuffer = await fileData.arrayBuffer();
        extractedText = await extractText(new Uint8Array(arrayBuffer));
        
        console.log('PDF text extraction completed, length:', extractedText.length);
      } else if (material.file_type?.includes('text')) {
        // Handle text files
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('cramintel-materials')
          .download(material.file_path);

        if (downloadError || !fileData) {
          throw new Error(`Failed to download text file: ${downloadError?.message}`);
        }

        extractedText = await fileData.text();
      } else {
        // For other file types, create placeholder content
        extractedText = `Study material: ${material.name}\nCourse: ${material.course}\nType: ${material.material_type}`;
      }
    } catch (extractionError) {
      console.error('Text extraction failed:', extractionError);
      // Fallback to basic content if extraction fails
      extractedText = `Study material: ${material.name}\nCourse: ${material.course}\nType: ${material.material_type}\n\nThis material could not be processed automatically. Please add your own notes or study content.`;
    }

    // Update processing status to processing_content
    await supabase
      .from('cramintel_materials')
      .update({ 
        processing_status: 'processing_content',
        processing_progress: 30 
      })
      .eq('id', materialId);

    // Clean and preprocess the text
    const cleanText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?;:()\-\[\]]/g, '')
      .trim();

    console.log('Cleaned text length:', cleanText.length);

    // Update processing status to generating_flashcards
    await supabase
      .from('cramintel_materials')
      .update({ 
        processing_status: 'generating_flashcards',
        processing_progress: 50 
      })
      .eq('id', materialId);

    // Generate flashcards using OpenAI
    let flashcards: FlashcardQuestion[] = [];

    try {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are an expert educator who creates high-quality flashcards for students. 

IMPORTANT REQUIREMENTS:
- Generate EXACTLY 20 flashcards, no more, no less
- Each flashcard should test specific knowledge from the content
- Make questions clear, concise, and testable
- Provide complete, accurate answers
- Vary difficulty levels: 6 easy, 8 medium, 6 hard
- Focus on key concepts, definitions, formulas, and important facts
- Avoid yes/no questions
- Make sure questions are self-contained (don't reference "the text")

Return your response as a JSON array with exactly this structure:
[
  {
    "question": "What is...",
    "answer": "Complete answer here",
    "difficulty": "easy|medium|hard",
    "topic": "specific topic if applicable"
  }
]

Do not include any text before or after the JSON array.`
            },
            {
              role: 'user',
              content: `Create exactly 20 high-quality flashcards from this ${material.course} ${material.material_type} content:

${cleanText.length > 8000 ? cleanText.substring(0, 8000) + '...' : cleanText}

Course: ${material.course}
Material Type: ${material.material_type}
Title: ${material.name}`
            }
          ],
          temperature: 0.7,
          max_tokens: 4000,
        }),
      });

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error('OpenAI API error:', errorText);
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }

      const openaiData = await openaiResponse.json();
      const flashcardsContent = openaiData.choices[0]?.message?.content;

      if (!flashcardsContent) {
        throw new Error('No flashcards content received from OpenAI');
      }

      try {
        flashcards = JSON.parse(flashcardsContent);
        
        // Validate we got exactly 20 flashcards
        if (!Array.isArray(flashcards) || flashcards.length !== 20) {
          console.warn(`Expected 20 flashcards, got ${flashcards.length}`);
          // If we didn't get exactly 20, pad or trim to 20
          if (flashcards.length < 20) {
            // Duplicate some flashcards to reach 20
            while (flashcards.length < 20) {
              const randomCard = flashcards[Math.floor(Math.random() * flashcards.length)];
              flashcards.push({ ...randomCard });
            }
          } else if (flashcards.length > 20) {
            // Trim to exactly 20
            flashcards = flashcards.slice(0, 20);
          }
        }
      } catch (parseError) {
        console.error('Failed to parse flashcards JSON:', parseError);
        // Generate fallback flashcards
        flashcards = generateFallbackFlashcards(material, cleanText);
      }
    } catch (openaiError) {
      console.error('OpenAI request failed:', openaiError);
      // Generate fallback flashcards
      flashcards = generateFallbackFlashcards(material, cleanText);
    }

    console.log(`Generated ${flashcards.length} flashcards`);

    // Update processing status to saving_flashcards
    await supabase
      .from('cramintel_materials')
      .update({ 
        processing_status: 'saving_flashcards',
        processing_progress: 80 
      })
      .eq('id', materialId);

    // Create a deck for these flashcards
    const { data: deck, error: deckError } = await supabase
      .from('cramintel_decks')
      .insert({
        name: `${material.name} - Flashcards`,
        description: `Generated from ${material.material_type} for ${material.course}`,
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

    // Save flashcards to database
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
      console.error('Error linking flashcards to deck:', linkError);
    }

    // Mark material as processed
    await supabase
      .from('cramintel_materials')
      .update({ 
        processed: true,
        processing_status: 'completed',
        processing_progress: 100 
      })
      .eq('id', materialId);

    console.log('Material processing completed successfully');

    return new Response(JSON.stringify({
      success: true,
      flashcards_generated: flashcards.length,
      deck_id: deck.id,
      message: `Successfully generated ${flashcards.length} flashcards`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-material function:', error);
    
    // Try to update the material status to error
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

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateFallbackFlashcards(material: any, text: string): FlashcardQuestion[] {
  const fallbackCards: FlashcardQuestion[] = [];
  
  // Generate 20 basic flashcards based on available information
  for (let i = 1; i <= 20; i++) {
    fallbackCards.push({
      question: `What is an important concept from ${material.name}? (Question ${i})`,
      answer: `This is a key concept from the ${material.material_type} for ${material.course}. Review the original material for specific details.`,
      difficulty: i <= 6 ? 'easy' : i <= 14 ? 'medium' : 'hard',
      topic: material.course
    });
  }
  
  return fallbackCards;
}
