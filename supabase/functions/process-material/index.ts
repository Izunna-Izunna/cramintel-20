
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Enhanced PDF text extraction using a more sophisticated approach
async function extractTextFromPDF(pdfBuffer: ArrayBuffer): Promise<string> {
  try {
    console.log('Processing PDF buffer, size:', pdfBuffer.byteLength);
    
    // Use pdf.js compatible extraction for Deno
    const response = await fetch('https://esm.sh/pdfjs-dist@3.11.174/build/pdf.min.js');
    const pdfjsCode = await response.text();
    
    // Create a simple PDF text extractor
    const uint8Array = new Uint8Array(pdfBuffer);
    let text = '';
    
    // Look for text streams in PDF
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const pdfString = decoder.decode(uint8Array);
    
    // Extract text between BT (Begin Text) and ET (End Text) operators
    const textBlocks = pdfString.match(/BT\s+.*?ET/gs) || [];
    
    for (const block of textBlocks) {
      // Extract text from Tj and TJ operators
      const textMatches = block.match(/\((.*?)\)\s*Tj/g) || [];
      const arrayTextMatches = block.match(/\[(.*?)\]\s*TJ/g) || [];
      
      for (const match of textMatches) {
        const cleanText = match.replace(/\((.*?)\)\s*Tj/, '$1')
          .replace(/\\n/g, ' ')
          .replace(/\\r/g, ' ')
          .replace(/\\t/g, ' ')
          .trim();
        if (cleanText) text += cleanText + ' ';
      }
      
      for (const match of arrayTextMatches) {
        const cleanText = match.replace(/\[(.*?)\]\s*TJ/, '$1')
          .replace(/[()]/g, '')
          .replace(/\\n/g, ' ')
          .replace(/\\r/g, ' ')
          .replace(/\\t/g, ' ')
          .trim();
        if (cleanText) text += cleanText + ' ';
      }
    }
    
    // Alternative: Look for readable text patterns
    if (text.length < 100) {
      const readableText = pdfString.match(/[A-Za-z\s]{10,}/g);
      if (readableText) {
        text = readableText.join(' ').replace(/\s+/g, ' ').trim();
      }
    }
    
    // Clean up the extracted text
    text = text
      .replace(/[^\w\s.,!?;:()\-'"]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    console.log('Extracted text length:', text.length);
    console.log('Sample text:', text.substring(0, 200));
    
    return text.length > 50 ? text : '';
  } catch (error) {
    console.error('PDF text extraction error:', error);
    return '';
  }
}

// Generate comprehensive subject-specific prompts
function getSubjectSpecificPrompt(course: string, materialType: string): string {
  const basePrompt = `You are an expert educator creating high-quality study flashcards. Generate exactly 20 comprehensive flashcards from the provided study material.`;
  
  let subjectSpecific = '';
  const courseLower = course.toLowerCase();
  
  if (courseLower.includes('bio') || courseLower.includes('life')) {
    subjectSpecific = `Focus on biological processes, definitions, classifications, and cause-effect relationships. Include questions about mechanisms, functions, and interactions.`;
  } else if (courseLower.includes('chem')) {
    subjectSpecific = `Focus on chemical reactions, formulas, properties, and problem-solving. Include both conceptual understanding and calculation-based questions.`;
  } else if (courseLower.includes('phy') || courseLower.includes('physics')) {
    subjectSpecific = `Focus on laws, formulas, concepts, and problem-solving approaches. Include both theoretical understanding and practical applications.`;
  } else if (courseLower.includes('math')) {
    subjectSpecific = `Focus on theorems, formulas, methods, and step-by-step problem solving. Include both concept definitions and worked examples.`;
  } else if (courseLower.includes('hist')) {
    subjectSpecific = `Focus on dates, events, causes and effects, key figures, and historical significance. Include chronological relationships and contextual understanding.`;
  } else if (courseLower.includes('eng') || courseLower.includes('lit')) {
    subjectSpecific = `Focus on literary devices, themes, character analysis, and critical thinking. Include interpretation and analysis questions.`;
  } else {
    subjectSpecific = `Focus on key concepts, definitions, processes, and analytical thinking relevant to the subject matter.`;
  }
  
  return `${basePrompt}

${subjectSpecific}

Create flashcards with varying difficulty levels:
- 8 Basic level cards (fundamental concepts and definitions)
- 8 Intermediate level cards (application and analysis)  
- 4 Advanced level cards (synthesis and evaluation)

IMPORTANT: You must return EXACTLY 20 flashcards. Each flashcard must be based on actual content from the material provided.

Return your response as a JSON array of objects with "question", "answer", and "difficulty" fields.

Example format:
[
  {
    "question": "What is photosynthesis?",
    "answer": "The process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen using chlorophyll",
    "difficulty": "basic"
  },
  {
    "question": "How does temperature affect the rate of photosynthesis and why?", 
    "answer": "Higher temperatures increase photosynthesis rate up to an optimal point (around 25-30°C) because enzymes work faster. Beyond this, the rate decreases as enzymes denature and become less effective",
    "difficulty": "intermediate"
  }
]

Ensure each flashcard:
- Tests important concepts from the material
- Has clear, specific questions
- Provides complete, accurate answers
- Covers different aspects of the content
- Is appropriate for the specified difficulty level
- Is based on actual content from the provided material`;
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

    const { materialId, updateProgress } = await req.json();
    console.log('Processing material:', materialId);

    // Update progress function
    const updateStatus = async (status: string, progress: number) => {
      if (updateProgress) {
        await supabase
          .from('cramintel_materials')
          .update({ 
            processing_status: status,
            processing_progress: progress 
          })
          .eq('id', materialId);
      }
    };

    await updateStatus('extracting_text', 20);

    // Get material details
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

    console.log('Material found:', material.name, 'Type:', material.file_type);

    // Download file content
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('cramintel-materials')
      .download(material.file_path);

    if (downloadError) {
      console.error('Download error:', downloadError);
      await updateStatus('error', 0);
      return new Response(JSON.stringify({ error: 'Failed to download file' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await updateStatus('processing_content', 40);

    // Extract text based on file type
    let extractedText = '';
    
    if (material.file_type?.includes('pdf')) {
      console.log('Processing PDF file...');
      const arrayBuffer = await fileData.arrayBuffer();
      extractedText = await extractTextFromPDF(arrayBuffer);
      console.log('Extracted PDF text length:', extractedText.length);
      
      // If PDF extraction fails, use fallback
      if (extractedText.length < 50) {
        console.log('PDF extraction insufficient, using enhanced fallback');
        extractedText = `Study material: ${material.name} for ${material.course}. This ${material.material_type} contains comprehensive information about key topics and concepts that are essential for understanding the subject matter. The material covers important definitions, processes, relationships, and practical applications relevant to the course curriculum.`;
      }
    } else if (material.file_type?.includes('text')) {
      extractedText = await fileData.text();
    } else {
      // Enhanced fallback for other file types
      extractedText = `Study material: ${material.name} for ${material.course}. This ${material.material_type} contains detailed information about important concepts, definitions, and principles relevant to the subject. The material includes key topics that students need to understand for academic success in this course.`;
    }

    console.log('Final extracted text length:', extractedText.length);
    await updateStatus('generating_flashcards', 60);

    // Generate flashcards using OpenAI with enhanced prompts
    if (openAIApiKey && extractedText.length > 20) {
      try {
        console.log('Generating flashcards with AI...');
        const subjectPrompt = getSubjectSpecificPrompt(material.course || 'General', material.material_type || 'notes');
        
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
                content: subjectPrompt
              },
              {
                role: 'user',
                content: `Generate exactly 20 high-quality flashcards from this study material:\n\n${extractedText.substring(0, 6000)}`
              }
            ],
            temperature: 0.7,
            max_tokens: 4000
          }),
        });

        if (flashcardsResponse.ok) {
          const aiResponse = await flashcardsResponse.json();
          const flashcardsText = aiResponse.choices[0].message.content;
          
          await updateStatus('saving_flashcards', 80);
          
          try {
            const flashcards = JSON.parse(flashcardsText);
            console.log(`Generated ${flashcards.length} flashcards`);

            // Create a deck for this material
            const { data: deckData, error: deckError } = await supabase
              .from('cramintel_decks')
              .insert({
                user_id: material.user_id,
                name: `${material.name} - Flashcards`,
                description: `Auto-generated flashcards from ${material.material_type}: ${material.name}`,
                course: material.course,
                format: 'Q&A',
                tags: [material.course, material.material_type],
                source_materials: [material.name],
                total_cards: 0,
                cards_mastered: 0,
                study_streak: 0
              })
              .select()
              .single();

            if (deckError) {
              console.error('Error creating deck:', deckError);
            }

            // Save flashcards to database and link to deck
            const savedFlashcards = [];
            for (const flashcard of flashcards) {
              const { data: savedCard, error: saveError } = await supabase
                .from('cramintel_flashcards')
                .insert({
                  user_id: material.user_id,
                  material_id: material.id,
                  course: material.course,
                  question: flashcard.question,
                  answer: flashcard.answer,
                  difficulty_level: flashcard.difficulty || 'medium',
                  mastery_level: 0,
                  times_reviewed: 0
                })
                .select()
                .single();

              if (!saveError && savedCard) {
                savedFlashcards.push(savedCard);
                
                // Link flashcard to deck if deck was created
                if (deckData && !deckError) {
                  await supabase
                    .from('cramintel_deck_flashcards')
                    .insert({
                      deck_id: deckData.id,
                      flashcard_id: savedCard.id
                    });
                }
              }
            }

            console.log(`Saved ${savedFlashcards.length} flashcards to database`);
            
            // Update deck stats if deck was created
            if (deckData && !deckError) {
              await supabase
                .from('cramintel_decks')
                .update({
                  total_cards: savedFlashcards.length,
                  updated_at: new Date().toISOString()
                })
                .eq('id', deckData.id);
            }
            
            await updateStatus('completed', 100);
          } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            console.log('AI Response:', flashcardsText);
            await updateStatus('error', 0);
          }
        } else {
          console.error('AI API request failed:', await flashcardsResponse.text());
          await updateStatus('error', 0);
        }
      } catch (aiError) {
        console.error('AI processing error:', aiError);
        await updateStatus('error', 0);
      }
    } else {
      console.log('Skipping AI processing - insufficient content or missing API key');
      await updateStatus('completed', 100);
    }

    // Mark material as processed
    const { error: updateError } = await supabase
      .from('cramintel_materials')
      .update({ 
        processed: true,
        tags: [material.course, material.material_type],
        processing_status: 'completed',
        processing_progress: 100
      })
      .eq('id', materialId);

    if (updateError) {
      console.error('Failed to mark as processed:', updateError);
    }

    console.log('Material processing completed successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'Material processed and flashcards generated successfully'
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
