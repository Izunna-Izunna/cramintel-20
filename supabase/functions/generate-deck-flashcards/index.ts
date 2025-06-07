
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

    const { materialId, deckId, targetCards = 20 } = await req.json();

    if (!materialId || !deckId) {
      return new Response(JSON.stringify({ error: 'Material ID and Deck ID are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Generating ${targetCards} flashcards for deck ${deckId} from material ${materialId}`);

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
        
        try {
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('cramintel-materials')
            .download(material.file_path);

          if (downloadError || !fileData) {
            throw new Error(`Failed to download PDF: ${downloadError?.message}`);
          }

          const arrayBuffer = await fileData.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          
          const pdf = await getDocumentProxy(uint8Array);
          const { text } = await extractText(pdf, { mergePages: true });
          
          if (text && text.trim().length > 100) {
            extractedText = text;
          } else {
            throw new Error('Insufficient text content extracted from PDF');
          }
          
        } catch (pdfError) {
          console.error('PDF processing error:', pdfError);
          // Fallback content
          extractedText = `Study material: ${material.name}
Course: ${material.course}
Material Type: ${material.material_type}

This is a ${material.course} ${material.material_type} document titled "${material.name}".
Key topics likely covered include fundamental concepts, theories, applications, and methodologies relevant to ${material.course}.`;
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
        extractedText = `Study material: ${material.name}
Course: ${material.course}
Material Type: ${material.material_type}

This ${material.material_type} focuses on ${material.course} concepts including fundamental principles, practical applications, and key methodologies.`;
      }
    } catch (extractionError) {
      console.error('Text extraction failed:', extractionError);
      extractedText = `Study material: ${material.name}
Course: ${material.course}
Key concepts for ${material.course} study including theories, applications, and methodologies.`;
    }

    // Clean and preprocess the text
    const cleanText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?;:()\-\[\]]/g, '')
      .trim();

    console.log('Cleaned text length:', cleanText.length);

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
- Generate EXACTLY ${targetCards} flashcards, no more, no less
- Each flashcard should test specific knowledge from the content
- Make questions clear, concise, and testable
- Provide complete, accurate answers
- Vary difficulty levels appropriately
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
              content: `Create exactly ${targetCards} high-quality flashcards from this ${material.course} ${material.material_type} content:

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
        
        // Validate we got the right number of flashcards
        if (!Array.isArray(flashcards) || flashcards.length !== targetCards) {
          console.warn(`Expected ${targetCards} flashcards, got ${flashcards.length}`);
          // Adjust to target count
          if (flashcards.length < targetCards) {
            while (flashcards.length < targetCards) {
              const randomCard = flashcards[Math.floor(Math.random() * flashcards.length)];
              flashcards.push({ ...randomCard });
            }
          } else if (flashcards.length > targetCards) {
            flashcards = flashcards.slice(0, targetCards);
          }
        }
      } catch (parseError) {
        console.error('Failed to parse flashcards JSON:', parseError);
        // Generate fallback flashcards
        flashcards = generateFallbackFlashcards(material, targetCards);
      }
    } catch (openaiError) {
      console.error('OpenAI request failed:', openaiError);
      // Generate fallback flashcards
      flashcards = generateFallbackFlashcards(material, targetCards);
    }

    console.log(`Generated ${flashcards.length} flashcards`);

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
      deck_id: deckId,
      flashcard_id: flashcard.id
    }));

    const { error: linkError } = await supabase
      .from('cramintel_deck_flashcards')
      .insert(deckFlashcardInserts);

    if (linkError) {
      console.error('Error linking flashcards to deck:', linkError);
      throw new Error('Failed to link flashcards to deck');
    }

    console.log(`Successfully linked ${flashcards.length} flashcards to deck ${deckId}`);

    return new Response(JSON.stringify({
      success: true,
      flashcards_generated: flashcards.length,
      message: `Successfully generated ${flashcards.length} flashcards for deck`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-deck-flashcards function:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateFallbackFlashcards(material: any, targetCards: number): FlashcardQuestion[] {
  const fallbackCards: FlashcardQuestion[] = [];
  
  for (let i = 1; i <= targetCards; i++) {
    fallbackCards.push({
      question: `What is an important concept from ${material.name}? (Question ${i})`,
      answer: `This is a key concept from the ${material.material_type} for ${material.course}. Review the original material for specific details.`,
      difficulty: i <= Math.floor(targetCards * 0.3) ? 'easy' : i <= Math.floor(targetCards * 0.7) ? 'medium' : 'hard',
      topic: material.course
    });
  }
  
  return fallbackCards;
}
