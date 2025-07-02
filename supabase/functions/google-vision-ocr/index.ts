
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath } = await req.json();
    
    if (!filePath) {
      return new Response(
        JSON.stringify({ error: 'File path is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('cramintel-materials')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error('Error downloading file:', downloadError);
      return new Response(
        JSON.stringify({ error: 'Failed to download file from storage' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Convert file to array buffer for processing
    const arrayBuffer = await fileData.arrayBuffer();
    
    // Determine file type
    const isImage = filePath.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|bmp)$/);
    const isPdf = filePath.toLowerCase().endsWith('.pdf');

    // Get Google Cloud Vision API key
    const apiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Google Cloud Vision API key not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let extractedText = '';
    let totalConfidence = 0;
    let pageCount = 1;
    let confidenceCount = 0;

    if (isImage) {
      // Process image directly
      const base64Content = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const result = await processImageWithVision(base64Content, apiKey);
      extractedText = result.text;
      totalConfidence = result.confidence || 0;
      confidenceCount = result.confidence ? 1 : 0;
    } else if (isPdf) {
      // Convert PDF to images and process each page
      const pdfImages = await convertPdfToImages(arrayBuffer);
      pageCount = pdfImages.length;
      
      console.log(`Processing ${pageCount} pages from PDF`);
      
      for (let i = 0; i < pdfImages.length; i++) {
        console.log(`Processing page ${i + 1}/${pageCount}`);
        
        const result = await processImageWithVision(pdfImages[i], apiKey);
        
        if (result.text.trim()) {
          extractedText += `--- Page ${i + 1} ---\n${result.text.trim()}\n\n`;
        }
        
        if (result.confidence) {
          totalConfidence += result.confidence;
          confidenceCount++;
        }
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported file type. Please upload JPEG, PNG, or PDF files.' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Calculate average confidence
    const avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : undefined;

    // Clean up: delete the uploaded file from storage
    await supabase.storage
      .from('cramintel-materials')
      .remove([filePath]);

    return new Response(
      JSON.stringify({
        extractedText: extractedText.trim(),
        confidence: avgConfidence,
        pages: isPdf ? pageCount : undefined,
        fileType: isImage ? 'image' : 'pdf'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in google-vision-ocr function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function convertPdfToImages(pdfArrayBuffer: ArrayBuffer): Promise<string[]> {
  try {
    // Use pdf-lib to parse the PDF
    const { PDFDocument } = await import('https://esm.sh/pdf-lib@1.17.1');
    
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
    const pageCount = pdfDoc.getPageCount();
    
    // Limit to 10 pages to prevent timeouts
    const maxPages = Math.min(pageCount, 10);
    const images: string[] = [];
    
    console.log(`Converting ${maxPages} pages from PDF to images`);
    
    for (let i = 0; i < maxPages; i++) {
      // Create a new PDF with just one page
      const singlePagePdf = await PDFDocument.create();
      const [copiedPage] = await singlePagePdf.copyPages(pdfDoc, [i]);
      singlePagePdf.addPage(copiedPage);
      
      // Convert to bytes
      const pdfBytes = await singlePagePdf.save();
      
      // Convert PDF page to image using canvas (simplified approach)
      // For production, you might want to use a more robust PDF-to-image converter
      const base64Pdf = btoa(String.fromCharCode(...pdfBytes));
      
      // Since we can't easily render PDF to canvas in Deno edge runtime,
      // we'll use a different approach: send the single-page PDF to Vision API
      // using the files endpoint which can handle PDFs
      const pageImage = await convertSinglePagePdfToImage(base64Pdf);
      images.push(pageImage);
    }
    
    return images;
  } catch (error) {
    console.error('Error converting PDF to images:', error);
    throw new Error(`PDF conversion failed: ${error.message}`);
  }
}

async function convertSinglePagePdfToImage(base64Pdf: string): Promise<string> {
  // For now, we'll create a placeholder approach
  // In a real implementation, you would use a proper PDF-to-image converter
  // Since we're in a Deno environment, options are limited
  
  // As a fallback, we'll return the PDF data and let Vision API handle it
  // using the document detection on the raw PDF data
  return base64Pdf;
}

async function processImageWithVision(base64Content: string, apiKey: string): Promise<{text: string, confidence?: number}> {
  try {
    // Determine if this is likely a PDF or an image
    const isPdfContent = base64Content.startsWith('JVBERi') || base64Content.includes('PDF');
    
    let visionRequest;
    
    if (isPdfContent) {
      // Use document text detection for PDF content
      visionRequest = {
        requests: [{
          image: {
            content: base64Content
          },
          features: [{
            type: 'DOCUMENT_TEXT_DETECTION'
          }]
        }]
      };
    } else {
      // Use text detection for images
      visionRequest = {
        requests: [{
          image: {
            content: base64Content
          },
          features: [{
            type: 'TEXT_DETECTION',
            maxResults: 1
          }]
        }]
      };
    }

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(visionRequest)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vision API error: ${response.status} - ${errorText}`);
    }

    const visionResponse = await response.json();
    
    // Check for API errors
    if (visionResponse.responses?.[0]?.error) {
      console.error('Vision API error:', visionResponse.responses[0].error);
      throw new Error(`Vision API error: ${visionResponse.responses[0].error.message}`);
    }

    let extractedText = '';
    let confidence = 0;

    if (isPdfContent) {
      // Handle document text detection response
      if (visionResponse.responses?.[0]?.fullTextAnnotation) {
        extractedText = visionResponse.responses[0].fullTextAnnotation.text || '';
        
        // Calculate confidence from pages if available
        const pages = visionResponse.responses[0].fullTextAnnotation.pages || [];
        if (pages.length > 0) {
          const confidenceSum = pages.reduce((sum: number, page: any) => {
            const pageConfidence = page.blocks?.reduce((blockSum: number, block: any) => 
              blockSum + (block.confidence || 0), 0) || 0;
            return sum + (pageConfidence / (page.blocks?.length || 1));
          }, 0);
          confidence = confidenceSum / pages.length;
        }
      }
    } else {
      // Handle regular text detection response
      if (visionResponse.responses?.[0]?.textAnnotations?.[0]) {
        extractedText = visionResponse.responses[0].textAnnotations[0].description || '';
        
        // Calculate average confidence from all detected text
        const annotations = visionResponse.responses[0].textAnnotations;
        if (annotations.length > 1) {
          const confidenceSum = annotations.slice(1).reduce((sum: number, annotation: any) => 
            sum + (annotation.confidence || 0), 0);
          confidence = confidenceSum / (annotations.length - 1);
        }
      }
    }

    return {
      text: extractedText,
      confidence: confidence > 0 ? confidence : undefined
    };
  } catch (error) {
    console.error('Error processing with Vision API:', error);
    throw error;
  }
}
