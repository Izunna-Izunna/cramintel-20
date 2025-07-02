
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

// Types
interface ProcessedPage {
  pageNumber: number;
  imageBuffer: Uint8Array;
  mimeType: string;
}

interface OCRResult {
  pageNumber: number;
  text: string;
  confidence?: number;
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting PDF OCR processing...');
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    console.log(`Processing file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);

    // Handle both PDFs and images
    if (file.type === 'application/pdf') {
      // Process PDF
      const pdfBuffer = await file.arrayBuffer();
      const pdfBytes = new Uint8Array(pdfBuffer);

      console.log('Converting PDF to processable format...');
      const processedPages = await processPdfDirectly(pdfBytes);
      console.log(`Successfully processed PDF into ${processedPages.length} pages`);

      // Process each page with Google Vision OCR
      console.log('Starting OCR processing...');
      const ocrResults: OCRResult[] = [];
      
      for (const page of processedPages) {
        try {
          const ocrResult = await performOCR(page);
          ocrResults.push(ocrResult);
          console.log(`Completed OCR for page ${page.pageNumber}`);
        } catch (error) {
          console.error(`OCR failed for page ${page.pageNumber}:`, error);
          ocrResults.push({
            pageNumber: page.pageNumber,
            text: '',
            confidence: 0
          });
        }
      }

      // Combine results
      const combinedText = ocrResults
        .sort((a, b) => a.pageNumber - b.pageNumber)
        .map(result => `--- Page ${result.pageNumber} ---\n${result.text}`)
        .join('\n\n');

      const response = {
        success: true,
        totalPages: processedPages.length,
        extractedText: combinedText,
        pageResults: ocrResults,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          processedAt: new Date().toISOString()
        }
      };

      return new Response(JSON.stringify(response), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      });

    } else if (file.type.startsWith('image/')) {
      // Process single image
      console.log('Processing single image...');
      const imageBuffer = await file.arrayBuffer();
      const processedImage: ProcessedPage = {
        pageNumber: 1,
        imageBuffer: new Uint8Array(imageBuffer),
        mimeType: file.type
      };

      const ocrResult = await performOCR(processedImage);
      
      const response = {
        success: true,
        totalPages: 1,
        extractedText: ocrResult.text,
        pageResults: [ocrResult],
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          processedAt: new Date().toISOString()
        }
      };

      return new Response(JSON.stringify(response), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      });

    } else {
      throw new Error(`Unsupported file type: ${file.type}. Please upload PDF, JPEG, or PNG files.`);
    }

  } catch (error) {
    console.error('Error in PDF OCR function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});

async function processPdfDirectly(pdfBytes: Uint8Array): Promise<ProcessedPage[]> {
  try {
    console.log('Processing PDF directly for Google Vision...');
    
    // For now, we'll send the entire PDF to Google Vision
    // Google Vision API can handle multi-page PDFs directly
    return [{
      pageNumber: 1,
      imageBuffer: pdfBytes,
      mimeType: 'application/pdf'
    }];

  } catch (error) {
    console.error('PDF processing error:', error);
    throw new Error(`PDF processing failed: ${error.message}`);
  }
}

async function performOCR(processedPage: ProcessedPage): Promise<OCRResult> {
  const googleCloudApiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY');
  
  if (!googleCloudApiKey) {
    throw new Error('GOOGLE_CLOUD_API_KEY environment variable is not set');
  }

  try {
    // Convert buffer to base64
    const base64Content = btoa(
      String.fromCharCode(...processedPage.imageBuffer)
    );

    // Prepare Google Vision API request
    const visionRequest = {
      requests: [{
        image: {
          content: base64Content
        },
        features: [{
          type: 'DOCUMENT_TEXT_DETECTION',
          maxResults: 1
        }]
      }]
    };

    console.log(`Sending OCR request for page ${processedPage.pageNumber}, content size: ${base64Content.length} chars`);
    
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${googleCloudApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(visionRequest),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Vision API error response:', errorText);
      throw new Error(`Google Vision API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Google Vision API response received');
    
    if (result.responses && result.responses[0]) {
      const response = result.responses[0];
      
      // Check for errors in the response
      if (response.error) {
        throw new Error(`Google Vision API error: ${response.error.message}`);
      }
      
      const annotation = response.fullTextAnnotation;
      
      if (annotation && annotation.text) {
        return {
          pageNumber: processedPage.pageNumber,
          text: annotation.text,
          confidence: annotation.pages?.[0]?.confidence || undefined
        };
      }
    }

    // No text found
    console.log(`No text detected in page ${processedPage.pageNumber}`);
    return {
      pageNumber: processedPage.pageNumber,
      text: '',
      confidence: 0
    };

  } catch (error) {
    console.error(`OCR error for page ${processedPage.pageNumber}:`, error);
    throw error;
  }
}
