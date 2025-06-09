
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

    const { materialId } = await req.json();

    if (!materialId) {
      return new Response(JSON.stringify({ error: 'Material ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing material:', materialId);

    // Update processing status
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
    let extractionMethod = 'unknown';
    let extractionConfidence = 0;

    try {
      if (material.file_type?.includes('pdf')) {
        console.log('Processing PDF with unpdf extraction');
        
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
          extractionMethod = 'unpdf';
          extractionConfidence = 75;
          console.log('PDF extraction successful');
        } else {
          throw new Error('Insufficient text content from PDF');
        }
        
      } else if (material.file_type?.includes('text')) {
        console.log('Processing text file');
        
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('cramintel-materials')
          .download(material.file_path);

        if (downloadError || !fileData) {
          throw new Error(`Failed to download text file: ${downloadError?.message}`);
        }

        extractedText = await fileData.text();
        extractionMethod = 'direct-text';
        extractionConfidence = 100;
      } else {
        // Generic fallback content for unsupported file types
        extractionMethod = 'generic-template';
        extractionConfidence = 50;
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
        processing_progress: 30,
        extraction_method: extractionMethod,
        extraction_confidence: extractionConfidence
      })
      .eq('id', materialId);

    // Clean text
    const cleanText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?;:()\-\[\]]/g, '')
      .trim();

    console.log('Cleaned text length:', cleanText.length);
    console.log('Extraction method:', extractionMethod, 'Confidence:', extractionConfidence);

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
              content: `You are an expert educator creating study flashcards from academic material.

REQUIREMENTS:
- Generate EXACTLY 20 flashcards from the provided content
- Base questions on specific information from the text
- Create meaningful, educational questions that test understanding
- Provide complete, accurate answers
- Distribute difficulty: 6 easy, 8 medium, 6 hard
- Focus on key concepts, definitions, and important facts
- Make questions specific and clear

EXTRACTION INFO:
- Method: ${extractionMethod}
- Confidence: ${extractionConfidence}%
- Adjust question complexity based on extraction quality

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
            },
            {
              role: 'user',
              content: `Create 20 flashcards from this ${material.course} material:

${cleanText.substring(0, 12000)}

Course: ${material.course}
Type: ${material.material_type}
Title: ${material.name}
Extraction Quality: ${extractionConfidence}%`
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
    const { data: deck, error: deckError } = await supabase
      .from('cramintel_decks')
      .insert({
        name: `${material.name} - Flashcards`,
        description: `Generated from ${material.material_type} for ${material.course} (${extractionMethod})`,
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

    return new Response(JSON.stringify({
      success: true,
      flashcards_generated: flashcards.length,
      deck_id: deck.id,
      extraction_method: extractionMethod,
      extraction_confidence: extractionConfidence,
      message: `Successfully generated ${flashcards.length} flashcards using ${extractionMethod} (${extractionConfidence}% confidence)`
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
