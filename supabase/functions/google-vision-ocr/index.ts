
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
    // Import PDF.js and canvas for server-side PDF rendering
    const { getDocument, GlobalWorkerOptions } = await import('https://esm.sh/pdfjs-dist@3.11.174');
    const { createCanvas } = await import('https://esm.sh/canvas@2.11.2');
    
    // Set up PDF.js worker
    GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    
    console.log('Loading PDF document...');
    const pdfDoc = await getDocument({ data: pdfArrayBuffer }).promise;
    const pageCount = pdfDoc.numPages;
    
    // Limit to 10 pages to prevent timeouts and excessive processing
    const maxPages = Math.min(pageCount, 10);
    const images: string[] = [];
    
    console.log(`Converting ${maxPages} pages from PDF to images`);
    
    for (let i = 1; i <= maxPages; i++) {
      console.log(`Converting page ${i}/${maxPages} to image...`);
      
      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR quality
      
      // Create canvas with appropriate dimensions
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');
      
      // Render PDF page to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Convert canvas to PNG base64
      const imageBuffer = canvas.toBuffer('image/png');
      const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
      
      // Validate that we have actual PNG data
      if (!base64Image.startsWith('iVBORw0KGgo')) {
        console.warn(`Page ${i} conversion may have failed - not valid PNG data`);
      }
      
      images.push(base64Image);
      console.log(`Page ${i} converted successfully (${Math.round(base64Image.length / 1024)}KB)`);
    }
    
    console.log(`Successfully converted ${images.length} pages to images`);
    return images;
    
  } catch (error) {
    console.error('Error converting PDF to images:', error);
    
    // If canvas approach fails, fall back to a simpler method
    console.log('Falling back to simpler PDF processing...');
    return await fallbackPdfProcessing(pdfArrayBuffer);
  }
}

async function fallbackPdfProcessing(pdfArrayBuffer: ArrayBuffer): Promise<string[]> {
  try {
    // Simple fallback: use pdf-lib to extract pages and send as single-page PDFs
    // This is less ideal but should work as a backup
    const { PDFDocument } = await import('https://esm.sh/pdf-lib@1.17.1');
    
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
    const pageCount = pdfDoc.getPageCount();
    const maxPages = Math.min(pageCount, 5); // Reduce pages for fallback
    const pdfPages: string[] = [];
    
    console.log(`Fallback: Processing ${maxPages} pages as single-page PDFs`);
    
    for (let i = 0; i < maxPages; i++) {
      const singlePagePdf = await PDFDocument.create();
      const [copiedPage] = await singlePagePdf.copyPages(pdfDoc, [i]);
      singlePagePdf.addPage(copiedPage);
      
      const pdfBytes = await singlePagePdf.save();
      const base64Pdf = btoa(String.fromCharCode(...pdfBytes));
      pdfPages.push(base64Pdf);
    }
    
    return pdfPages;
  } catch (error) {
    console.error('Fallback PDF processing also failed:', error);
    throw new Error(`PDF processing completely failed: ${error.message}`);
  }
}

async function processImageWithVision(base64Content: string, apiKey: string): Promise<{text: string, confidence?: number}> {
  try {
    // Check if content is PNG image data (starts with PNG signature)
    const isPngImage = base64Content.startsWith('iVBORw0KGgo');
    // Check if content is JPEG image data (starts with JPEG signature)
    const isJpegImage = base64Content.startsWith('/9j/');
    // Check if it's still PDF data (fallback case)
    const isPdfContent = base64Content.startsWith('JVBERi');
    
    console.log(`Processing content: PNG=${isPngImage}, JPEG=${isJpegImage}, PDF=${isPdfContent}`);
    
    let visionRequest;
    
    if (isPngImage || isJpegImage) {
      // Use image text detection for actual image data
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
    } else if (isPdfContent) {
      // For fallback PDF processing, use document text detection
      console.log('Processing PDF content directly (fallback mode)');
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
      console.warn('Unknown content type, treating as image');
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

    console.log('Sending request to Google Vision API...');
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
      console.error('Vision API HTTP Error:', response.status, errorText);
      throw new Error(`Vision API error: ${response.status} - ${errorText}`);
    }

    const visionResponse = await response.json();
    console.log('Vision API response received');
    
    // Check for API errors
    if (visionResponse.responses?.[0]?.error) {
      console.error('Vision API error:', visionResponse.responses[0].error);
      throw new Error(`Vision API error: ${visionResponse.responses[0].error.message}`);
    }

    let extractedText = '';
    let confidence = 0;

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
    // Handle regular text detection response (fallback)
    else if (visionResponse.responses?.[0]?.textAnnotations?.[0]) {
      extractedText = visionResponse.responses[0].textAnnotations[0].description || '';
      
      // Calculate average confidence from all detected text
      const annotations = visionResponse.responses[0].textAnnotations;
      if (annotations.length > 1) {
        const confidenceSum = annotations.slice(1).reduce((sum: number, annotation: any) => 
          sum + (annotation.confidence || 0), 0);
        confidence = confidenceSum / (annotations.length - 1);
      }
    }

    console.log(`Extracted ${extractedText.length} characters with confidence: ${confidence}`);
    return {
      text: extractedText,
      confidence: confidence > 0 ? confidence : undefined
    };
    
  } catch (error) {
    console.error('Error processing with Vision API:', error);
    throw error;
  }
}
