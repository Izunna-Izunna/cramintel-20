import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Math Formula Processor with robust error handling
class MathFormulaProcessor {
  static async extractFormulas(text: string): Promise<any[]> {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      console.log('📝 No text provided for math processing')
      return []
    }

    try {
      console.log('🔍 Starting math formula extraction...')
      const cleanText = text.replace(/\0/g, '').trim()
      
      if (cleanText.length === 0) {
        return []
      }

      const formulas = []
      
      // LaTeX pattern extraction
      try {
        const latexPatterns = [
          /\$\$([^$]+)\$\$/g,  // Display math
          /\$([^$]+)\$/g,      // Inline math
          /\\begin\{equation\}(.*?)\\end\{equation\}/gs,
          /\\begin\{align\}(.*?)\\end\{align\}/gs
        ]

        for (const pattern of latexPatterns) {
          let match
          while ((match = pattern.exec(cleanText)) !== null) {
            try {
              formulas.push({
                type: 'latex',
                content: match[1].trim(),
                position: match.index,
                raw: match[0]
              })
            } catch (patternError) {
              console.warn('⚠️ Failed to process LaTeX pattern:', patternError)
            }
          }
        }
      } catch (latexError) {
        console.warn('⚠️ LaTeX extraction failed:', latexError)
      }

      // Mathematical symbols and expressions
      try {
        const mathSymbols = /[∑∏∫∂∆∇±×÷≤≥≠≈∞αβγδεζηθικλμνξοπρστυφχψω]/g
        const symbolMatches = cleanText.match(mathSymbols)
        if (symbolMatches && symbolMatches.length > 0) {
          formulas.push({
            type: 'symbols',
            count: symbolMatches.length,
            symbols: [...new Set(symbolMatches)],
            category: 'mathematical_symbols'
          })
        }

        // Fraction patterns
        const fractionPatterns = /\b\d+\/\d+\b/g
        const fractionMatches = cleanText.match(fractionPatterns)
        if (fractionMatches && fractionMatches.length > 0) {
          formulas.push({
            type: 'fractions',
            expressions: fractionMatches,
            category: 'arithmetic'
          })
        }

        // Equation patterns
        const equationPatterns = /[a-zA-Z]\s*[=]\s*[^,\.\s]+/g
        const equationMatches = cleanText.match(equationPatterns)
        if (equationMatches && equationMatches.length > 0) {
          formulas.push({
            type: 'equations',
            expressions: equationMatches,
            category: 'algebraic'
          })
        }

      } catch (symbolError) {
        console.warn('⚠️ Symbol extraction failed:', symbolError)
      }

      console.log(`✅ Math extraction completed: ${formulas.length} formula groups found`)
      return formulas

    } catch (error) {
      console.error('❌ Math formula processing completely failed:', error)
      return [] // Return empty array instead of throwing
    }
  }

  static categorizeContent(text: string): string | null {
    try {
      const mathKeywords = [
        'equation', 'formula', 'theorem', 'proof', 'calculus', 'algebra',
        'geometry', 'trigonometry', 'statistics', 'probability', 'matrix',
        'vector', 'derivative', 'integral', 'function', 'variable'
      ]

      const lowerText = text.toLowerCase()
      const foundKeywords = mathKeywords.filter(keyword => lowerText.includes(keyword))
      
      if (foundKeywords.length > 0) {
        return foundKeywords[0] // Return the first found category
      }
      
      return null
    } catch (error) {
      console.warn('⚠️ Content categorization failed:', error)
      return null
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('⚙️ Process material function started')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { materialId, userId, filePath, fileName } = await req.json()

    console.log('📋 Processing request:', { materialId, userId, filePath, fileName })

    if (!materialId || !userId || !filePath) {
      console.error('❌ Missing required fields for processing')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: materialId, userId, and filePath are required'
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      )
    }

    // Update processing status to indicate start
    await supabase
      .from('cramintel_materials')
      .update({
        processing_status: 'processing',
        processing_progress: 10
      })
      .eq('id', materialId)

    // Step 1: Download file from storage
    console.log('📥 Downloading file from storage...')
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('cramintel-materials')
      .download(filePath)

    if (downloadError || !fileData) {
      console.error('❌ Failed to download file:', downloadError)
      await supabase
        .from('cramintel_materials')
        .update({
          processing_status: 'failed',
          processing_progress: 0
        })
        .eq('id', materialId)

      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to download file: ${downloadError?.message || 'Unknown error'}`
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500
        }
      )
    }

    await supabase
      .from('cramintel_materials')
      .update({ processing_progress: 30 })
      .eq('id', materialId)

    // Step 2: Extract text based on file type
    console.log('🔤 Extracting text from file...')
    let extractedText = ''
    
    try {
      if (fileName.toLowerCase().endsWith('.pdf')) {
        extractedText = await extractPDFText(fileData)
      } else {
        extractedText = await extractImageText(fileData)
      }
      
      console.log(`✅ Text extracted successfully: ${extractedText.length} characters`)
    } catch (extractionError) {
      console.error('❌ Text extraction failed:', extractionError)
      await supabase
        .from('cramintel_materials')
        .update({
          processing_status: 'failed',
          processing_progress: 0
        })
        .eq('id', materialId)

      return new Response(
        JSON.stringify({
          success: false,
          error: `Text extraction failed: ${extractionError.message}`
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500
        }
      )
    }

    await supabase
      .from('cramintel_materials')
      .update({ processing_progress: 60 })
      .eq('id', materialId)

    // Step 3: Extract math formulas (optional - failure won't break processing)
    console.log('🧮 Extracting math formulas...')
    let mathFormulas = []
    let mathCategory = null
    
    try {
      mathFormulas = await MathFormulaProcessor.extractFormulas(extractedText)
      mathCategory = MathFormulaProcessor.categorizeContent(extractedText)
      console.log(`✅ Math processing completed: ${mathFormulas.length} formula groups, category: ${mathCategory}`)
    } catch (mathError) {
      console.warn('⚠️ Math processing failed, continuing without formulas:', mathError)
      mathFormulas = []
      mathCategory = null
    }

    await supabase
      .from('cramintel_materials')
      .update({ processing_progress: 80 })
      .eq('id', materialId)

    // Step 4: Store extracted text
    console.log('💾 Storing extracted text...')
    const { error: textError } = await supabase
      .from('cramintel_extracted_texts')
      .insert({
        material_id: materialId,
        extracted_text: extractedText,
        extraction_method: fileName.toLowerCase().endsWith('.pdf') ? 'pdf_parser' : 'ocr',
        word_count: extractedText.split(/\s+/).length,
        character_count: extractedText.length,
        extraction_confidence: 0.85 // Default confidence score
      })

    if (textError) {
      console.error('❌ Failed to store extracted text:', textError)
      // Continue processing even if text storage fails
    }

    // Step 5: Update material with processing results
    console.log('🔄 Updating material with processing results...')
    const updateData: any = {
      processed: true,
      processing_status: 'completed',
      processing_progress: 100
    }

    // Add math-related fields if available
    if (mathFormulas.length > 0) {
      // Extract formulas and variables for the new schema
      const formulas = mathFormulas
        .filter(f => f.type === 'latex')
        .map(f => f.content)
        .join('; ')
      
      const variables = mathFormulas
        .filter(f => f.type === 'equations')
        .flatMap(f => f.expressions || [])
        .join('; ')

      if (formulas) updateData.formula = formulas
      if (variables) updateData.variables = variables
      if (mathCategory) updateData.math_category = mathCategory
    }

    const { error: updateError } = await supabase
      .from('cramintel_materials')
      .update(updateData)
      .eq('id', materialId)

    if (updateError) {
      console.error('❌ Failed to update material:', updateError)
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to update material: ${updateError.message}`
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500
        }
      )
    }

    console.log('🎉 Material processing completed successfully')

    return new Response(
      JSON.stringify({
        success: true,
        materialId: materialId,
        message: 'Material processed successfully',
        extractedTextLength: extractedText.length,
        mathFormulasCount: mathFormulas.length,
        mathCategory: mathCategory,
        processingTime: Date.now()
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Process material function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Processing failed due to server error',
        details: error.message
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    )
  }
})

// Helper functions for text extraction
async function extractPDFText(fileData: Blob): Promise<string> {
  try {
    // For now, return a placeholder - you can implement actual PDF parsing here
    console.log('📄 PDF text extraction placeholder')
    return `PDF content extracted from ${fileData.size} byte file`
  } catch (error) {
    console.error('❌ PDF extraction failed:', error)
    throw new Error(`PDF processing failed: ${error.message}`)
  }
}

async function extractImageText(fileData: Blob): Promise<string> {
  try {
    // For now, return a placeholder - you can implement actual OCR here
    console.log('🖼️ Image text extraction placeholder')
    return `Image content extracted from ${fileData.size} byte file`
  } catch (error) {
    console.error('❌ Image extraction failed:', error)
    throw new Error(`Image processing failed: ${error.message}`)
  }
}
