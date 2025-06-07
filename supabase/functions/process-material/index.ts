
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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

    const { materialId } = await req.json();
    console.log('Processing material:', materialId);

    // Get material details from database
    const { data: material, error: materialError } = await supabase
      .from('cramintel_materials')
      .select('*')
      .eq('id', materialId)
      .single();

    if (materialError || !material) {
      console.error('Material not found:', materialError);
      return new Response(JSON.stringify({ error: 'Material not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Material found:', material.name);

    // Download file content for processing
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('cramintel-materials')
      .download(material.file_path);

    if (downloadError) {
      console.error('Download error:', downloadError);
      return new Response(JSON.stringify({ error: 'Failed to download file' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process based on file type
    let extractedText = '';
    
    if (material.file_type?.includes('text')) {
      extractedText = await fileData.text();
    } else {
      // For other file types, we'll use a simplified approach
      // In a real implementation, you'd use libraries for PDF parsing, OCR, etc.
      extractedText = `Content from ${material.name} (${material.file_type})`;
    }

    console.log('Extracted text length:', extractedText.length);

    // Generate flashcards using OpenAI
    if (openAIApiKey && extractedText.length > 50) {
      try {
        const flashcardsResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are an expert at creating study flashcards. Generate 5-10 high-quality flashcards from the provided study material. 
                
                Return your response as a JSON array of objects with "question" and "answer" fields. 
                
                Focus on:
                - Key concepts and definitions
                - Important facts and figures  
                - Process explanations
                - Critical thinking questions
                
                Example format:
                [
                  {"question": "What is photosynthesis?", "answer": "The process by which plants convert sunlight into energy using chlorophyll"},
                  {"question": "What are the main reactants in photosynthesis?", "answer": "Carbon dioxide, water, and sunlight"}
                ]`
              },
              {
                role: 'user',
                content: `Generate flashcards from this study material:\n\n${extractedText.substring(0, 3000)}`
              }
            ],
            temperature: 0.7,
            max_tokens: 2000
          }),
        });

        if (flashcardsResponse.ok) {
          const aiResponse = await flashcardsResponse.json();
          const flashcardsText = aiResponse.choices[0].message.content;
          
          try {
            const flashcards = JSON.parse(flashcardsText);
            console.log(`Generated ${flashcards.length} flashcards`);

            // Save flashcards to database
            for (const flashcard of flashcards) {
              await supabase
                .from('cramintel_flashcards')
                .insert({
                  user_id: material.user_id,
                  material_id: material.id,
                  course: material.course,
                  question: flashcard.question,
                  answer: flashcard.answer,
                  difficulty_level: 'medium',
                  mastery_level: 0,
                  times_reviewed: 0
                });
            }

            console.log('Flashcards saved to database');
          } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
          }
        }
      } catch (aiError) {
        console.error('AI processing error:', aiError);
      }
    }

    // Mark material as processed
    const { error: updateError } = await supabase
      .from('cramintel_materials')
      .update({ 
        processed: true,
        tags: [material.course, material.material_type]
      })
      .eq('id', materialId);

    if (updateError) {
      console.error('Failed to mark as processed:', updateError);
    }

    console.log('Material processing completed');

    return new Response(JSON.stringify({
      success: true,
      message: 'Material processed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-material function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
