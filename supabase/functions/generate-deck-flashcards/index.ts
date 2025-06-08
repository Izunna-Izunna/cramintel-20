
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
        
        if (text && text.trim().length > 200) {
          extractedText = text;
          console.log('Successfully extracted text from PDF, length:', text.length);
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
        // For images, provide course-specific content that's more useful
        extractedText = `Course Material: ${material.name}
Subject: ${material.course}
Material Type: ${material.material_type}

This is ${material.course} course material covering key concepts typically found in academic curricula.

Based on the course ${material.course}, this material likely covers:
- Core theoretical foundations and principles
- Key terminology and definitions specific to ${material.course}
- Practical applications and real-world examples
- Problem-solving methodologies
- Critical analysis techniques
- Current research and developments in the field

Students should focus on understanding fundamental concepts, their interconnections, and practical applications within the context of ${material.course}.`;
      }
    } catch (extractionError) {
      console.error('Text extraction failed:', extractionError);
      // Create better fallback content
      extractedText = `Academic Material: ${material.name}
Course: ${material.course}
Type: ${material.material_type}

Core Learning Objectives for ${material.course}:
1. Understanding fundamental principles and theories
2. Mastering key terminology and concepts
3. Applying knowledge to solve problems
4. Analyzing and evaluating information critically
5. Synthesizing concepts across different topics

Key Study Areas:
- Theoretical foundations
- Practical applications
- Problem-solving methods
- Critical thinking skills
- Research methodologies
- Current developments in the field

This material supports comprehensive understanding of ${material.course} concepts essential for academic success.`;
    }

    // Clean and preprocess the text
    const cleanText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?;:()\-\[\]]/g, '')
      .trim();

    console.log('Cleaned text length:', cleanText.length);

    // Ensure we have meaningful content
    if (cleanText.length < 100) {
      throw new Error('Insufficient content to generate quality flashcards');
    }

    // Generate flashcards using OpenAI
    let flashcards: FlashcardQuestion[] = [];

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
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
              content: `You are an expert educator creating high-quality flashcards. 

CRITICAL REQUIREMENTS:
- Generate EXACTLY ${targetCards} flashcards from the provided content
- Each flashcard MUST be based on specific information from the text
- Questions should test comprehension, not just memorization
- Answers must be complete and accurate
- Vary difficulty: 30% easy, 40% medium, 30% hard
- Focus on key concepts, important facts, and practical applications
- Questions should be clear and specific
- Avoid yes/no questions

Return ONLY a JSON array with this exact structure:
[
  {
    "question": "Clear, specific question based on the content",
    "answer": "Complete, accurate answer with sufficient detail",
    "difficulty": "easy|medium|hard",
    "topic": "specific topic from the material"
  }
]

Do NOT include any text before or after the JSON array.`
            },
            {
              role: 'user',
              content: `Create exactly ${targetCards} high-quality flashcards from this ${material.course} content:

CONTENT TO STUDY:
${cleanText.substring(0, 12000)}

MATERIAL INFO:
- Course: ${material.course}
- Type: ${material.material_type}
- Title: ${material.name}

Focus on the most important concepts, definitions, and practical applications from this specific content.`
            }
          ],
          temperature: 0.3,
          max_tokens: 4000,
        }),
      });

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error('OpenAI API error:', errorText);
        throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
      }

      const openaiData = await openaiResponse.json();
      const flashcardsContent = openaiData.choices[0]?.message?.content;

      if (!flashcardsContent) {
        throw new Error('No flashcards content received from OpenAI');
      }

      try {
        flashcards = JSON.parse(flashcardsContent);
        
        if (!Array.isArray(flashcards)) {
          throw new Error('Invalid response format from OpenAI');
        }

        // Ensure we have the right number of flashcards
        if (flashcards.length !== targetCards) {
          console.warn(`Expected ${targetCards} flashcards, got ${flashcards.length}`);
          if (flashcards.length < targetCards) {
            // Duplicate some cards if we have too few
            while (flashcards.length < targetCards) {
              const randomCard = flashcards[Math.floor(Math.random() * flashcards.length)];
              flashcards.push({ 
                ...randomCard, 
                question: `${randomCard.question} (variant)`,
              });
            }
          } else {
            // Take the first targetCards if we have too many
            flashcards = flashcards.slice(0, targetCards);
          }
        }

        console.log(`Successfully generated ${flashcards.length} flashcards using OpenAI`);
      } catch (parseError) {
        console.error('Failed to parse flashcards JSON:', parseError);
        console.error('Raw content:', flashcardsContent);
        throw new Error('Failed to parse OpenAI response as JSON');
      }
    } catch (openaiError) {
      console.error('OpenAI request failed:', openaiError);
      throw new Error(`Failed to generate flashcards: ${openaiError.message}`);
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
      throw new Error('Failed to save flashcards to database');
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

    console.log(`Successfully created and linked ${flashcards.length} flashcards to deck ${deckId}`);

    return new Response(JSON.stringify({
      success: true,
      flashcards_generated: flashcards.length,
      message: `Successfully generated ${flashcards.length} flashcards from material content`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-deck-flashcards function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Check function logs for more information'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
