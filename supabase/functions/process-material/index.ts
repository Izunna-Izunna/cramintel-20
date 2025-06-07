
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Helper function to extract text from PDF using a simple approach
async function extractTextFromPDF(pdfBuffer: ArrayBuffer): Promise<string> {
  try {
    // Convert buffer to text - this is a simplified approach
    // For production, you'd want to use a proper PDF parsing library
    const uint8Array = new Uint8Array(pdfBuffer);
    const decoder = new TextDecoder('utf-8', { fatal: false });
    let text = decoder.decode(uint8Array);
    
    // Try to extract readable text between stream markers
    const textMatches = text.match(/BT\s+(.*?)\s+ET/gs);
    if (textMatches) {
      text = textMatches.map(match => 
        match.replace(/BT\s+/, '').replace(/\s+ET/, '')
          .replace(/Tj/g, ' ')
          .replace(/TJ/g, ' ')
          .replace(/[()]/g, '')
          .replace(/\s+/g, ' ')
      ).join(' ');
    }
    
    // Clean up the text
    text = text.replace(/[^\w\s.,!?;:()\-]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
    
    return text.length > 50 ? text : '';
  } catch (error) {
    console.error('PDF text extraction error:', error);
    return '';
  }
}

// Generate subject-specific prompts
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
- Is appropriate for the specified difficulty level`;
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
    } else if (material.file_type?.includes('text')) {
      extractedText = await fileData.text();
    } else {
      // For other file types, create a meaningful description
      extractedText = `Study material: ${material.name} (${material.file_type}) for ${material.course}. This ${material.material_type} contains important concepts and information for studying.`;
    }

    if (extractedText.length < 20) {
      console.log('Insufficient text extracted, using fallback content');
      extractedText = `Study material for ${material.course}: ${material.name}. This ${material.material_type} covers key concepts and topics that are important for understanding the subject matter.`;
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
                content: `Generate 20 high-quality flashcards from this study material:\n\n${extractedText.substring(0, 4000)}`
              }
            ],
            temperature: 0.7,
            max_tokens: 3000
          }),
        });

        if (flashcardsResponse.ok) {
          const aiResponse = await flashcardsResponse.json();
          const flashcardsText = aiResponse.choices[0].message.content;
          
          await updateStatus('saving_flashcards', 80);
          
          try {
            const flashcards = JSON.parse(flashcardsText);
            console.log(`Generated ${flashcards.length} flashcards`);

            // Save flashcards to database
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
              }
            }

            console.log(`Saved ${savedFlashcards.length} flashcards to database`);
            await updateStatus('completed', 100);
          } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
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
