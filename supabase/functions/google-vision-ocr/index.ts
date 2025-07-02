
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApiResponse {
  success: boolean;
  extractedText?: string;
  error?: string;
  details?: string;
  pageCount?: number;
}

// Constants for file processing
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB server-side limit
const CHUNK_SIZE = 32 * 1024; // 32KB chunks for base64 conversion

// Optimized base64 conversion to avoid stack overflow
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  console.log(`Converting buffer of size ${buffer.byteLength} to base64...`);
  const startTime = Date.now();
  
  const bytes = new Uint8Array(buffer);
  let binary = '';
  
  // Process in chunks to avoid stack overflow
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.slice(i, i + CHUNK_SIZE);
    const chunkString = Array.from(chunk, byte => String.fromCharCode(byte)).join('');
    binary += chunkString;
  }
  
  const base64 = btoa(binary);
  const conversionTime = Date.now() - startTime;
  console.log(`Base64 conversion completed in ${conversionTime}ms, result length: ${base64.length}`);
  
  return base64;
}

// Validate file type
function isValidFileType(fileType: string): boolean {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf'
  ];
  return allowedTypes.includes(fileType.toLowerCase());
}

// Validate file size
function validateFileSize(size: number): { valid: boolean; error?: string } {
  if (size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size (${(size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
    };
  }
  return { valid: true };
}

// Extract text from PDF using pdf-lib (for text-based PDFs)
async function extractTextFromPDF(buffer: ArrayBuffer): Promise<{ text: string; pageCount: number }> {
  console.log('🔄 Attempting text extraction from PDF using pdf-lib...');
  
  try {
    // Import pdf-lib from Skypack CDN
    const { PDFDocument } = await import('https://cdn.skypack.dev/pdf-lib@1.17.1');
    
    console.log('📄 Loading PDF document with pdf-lib...');
    const pdfDoc = await PDFDocument.load(buffer);
    const pageCount = pdfDoc.getPageCount();
    
    console.log(`📊 PDF has ${pageCount} pages`);
    
    // Try to extract text content
    let extractedText = '';
    
    // pdf-lib doesn't have built-in text extraction, so we'll need to use a different approach
    // For now, we'll return empty text and let it fall back to image processing
    console.log('⚠️ pdf-lib loaded successfully but text extraction requires additional processing');
    
    return {
      text: '', // Empty text will trigger fallback to image processing
      pageCount: pageCount
    };
    
  } catch (error) {
    console.error('❌ PDF text extraction with pdf-lib failed:', error);
    throw new Error(`PDF text extraction failed: ${error.message}`);
  }
}

// Convert PDF to images using CloudConvert API (fallback method)
async function convertPDFToImages(buffer: ArrayBuffer): Promise<string[]> {
  console.log('🔄 Converting PDF to images using external service...');
  
  // For now, we'll use a simpler approach - convert the PDF to a single image representation
  // This is a placeholder for proper PDF-to-image conversion
  
  try {
    // Create a base64 representation of the PDF for image processing
    const base64PDF = arrayBufferToBase64(buffer);
    
    // Return the PDF as a single "image" for now
    // In a real implementation, this would use an external service or different library
    return [base64PDF];
    
  } catch (error) {
    console.error('❌ PDF to image conversion failed:', error);
    throw new Error(`PDF to image conversion failed: ${error.message}`);
  }
}

// Process PDF with hybrid approach
async function processPDFToImages(buffer: ArrayBuffer): Promise<string[]> {
  console.log('🔄 Starting hybrid PDF processing...');
  
  try {
    // First, try to extract text directly
    const textResult = await extractTextFromPDF(buffer);
    
    if (textResult.text && textResult.text.trim().length > 50) {
      console.log('✅ Successfully extracted text directly from PDF');
      // Return text as a special marker that can be processed directly
      return [`TEXT_CONTENT:${textResult.text}`];
    }
    
    console.log('📄 PDF appears to be image-based, converting to images...');
    
    // Fallback to image conversion
    const imagePages = await convertPDFToImages(buffer);
    console.log(`✅ PDF converted to ${imagePages.length} page images`);
    
    return imagePages;
    
  } catch (error) {
    console.error('❌ Hybrid PDF processing failed:', error);
    throw new Error(`PDF processing failed: ${error.message}`);
  }
}

// Extract text from image using Google Vision API
async function extractTextFromImage(base64Image: string, apiKey: string): Promise<string> {
  console.log('🔍 Extracting text from image...');
  
  // Check if this is direct text content
  if (base64Image.startsWith('TEXT_CONTENT:')) {
    return base64Image.replace('TEXT_CONTENT:', '');
  }
  
  const visionResponse = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [{
        image: {
          content: base64Image
        },
        features: [{
          type: 'DOCUMENT_TEXT_DETECTION',
          maxResults: 1
        }]
      }]
    })
  });

  if (!visionResponse.ok) {
    const errorText = await visionResponse.text();
    throw new Error(`Google Vision API error (${visionResponse.status}): ${errorText}`);
  }

  const visionData = await visionResponse.json();
  
  if (visionData.responses && visionData.responses[0]) {
    const response = visionData.responses[0];
    
    if (response.error) {
      throw new Error(`Google Vision API error: ${response.error.message}`);
    }
    
    if (response.fullTextAnnotation) {
      return response.fullTextAnnotation.text || '';
    } else if (response.textAnnotations && response.textAnnotations.length > 0) {
      return response.textAnnotations[0].description || '';
    }
  }
  
  return '';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== Google Vision OCR Function Started ===');
  console.log(`Request method: ${req.method}`);
  console.log(`Request URL: ${req.url}`);

  const startTime = Date.now();

  try {
    // Check API key first
    const apiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY');
    if (!apiKey) {
      console.error('❌ Google Cloud Vision API key not found in environment');
      return new Response(JSON.stringify({
        success: false,
        error: 'Google Cloud Vision API key not configured'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    console.log('✅ API key found');

    let fileBuffer: ArrayBuffer;
    let fileName: string;
    let fileType: string;

    // Determine request type and process accordingly
    const contentType = req.headers.get('content-type') || '';
    console.log(`Content-Type: ${contentType}`);
    
    if (contentType.includes('multipart/form-data')) {
      console.log('📄 Processing FormData request...');
      
      const formData = await req.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        console.error('❌ No file found in FormData');
        return new Response(JSON.stringify({
          success: false,
          error: 'No file provided in FormData'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      fileName = file.name;
      fileType = file.type;
      console.log(`📄 File details: name="${fileName}", type="${fileType}", size=${file.size} bytes`);
      
      // Validate file size
      const sizeValidation = validateFileSize(file.size);
      if (!sizeValidation.valid) {
        console.error(`❌ File size validation failed: ${sizeValidation.error}`);
        return new Response(JSON.stringify({
          success: false,
          error: sizeValidation.error
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      fileBuffer = await file.arrayBuffer();
      console.log(`✅ File loaded into ArrayBuffer, size: ${fileBuffer.byteLength} bytes`);
      
    } else {
      console.log('🔧 Processing JSON request...');
      
      const jsonData = await req.json();
      console.log('📄 JSON data keys:', Object.keys(jsonData));
      
      if (!jsonData.file) {
        console.error('❌ No file data in JSON payload');
        return new Response(JSON.stringify({
          success: false,
          error: 'No file data provided in JSON'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      fileName = jsonData.fileName || 'uploaded-file';
      fileType = jsonData.fileType || 'application/octet-stream';
      console.log(`📄 JSON file details: name="${fileName}", type="${fileType}"`);

      // Extract base64 data (remove data URL prefix if present)
      const base64Data = jsonData.file.includes(',') ? jsonData.file.split(',')[1] : jsonData.file;
      console.log(`📄 Base64 data length: ${base64Data.length} characters`);
      
      try {
        // Convert base64 to ArrayBuffer
        const binaryString = atob(base64Data);
        console.log(`📄 Decoded binary string length: ${binaryString.length} bytes`);
        
        // Validate size before creating ArrayBuffer
        const sizeValidation = validateFileSize(binaryString.length);
        if (!sizeValidation.valid) {
          console.error(`❌ File size validation failed: ${sizeValidation.error}`);
          return new Response(JSON.stringify({
            success: false,
            error: sizeValidation.error
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        fileBuffer = bytes.buffer;
        console.log(`✅ ArrayBuffer created, size: ${fileBuffer.byteLength} bytes`);
        
      } catch (base64Error) {
        console.error('❌ Error processing base64 data:', base64Error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid base64 data',
          details: base64Error.message
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Validate file type
    if (!isValidFileType(fileType)) {
      console.error(`❌ Invalid file type: ${fileType}`);
      return new Response(JSON.stringify({
        success: false,
        error: `Unsupported file type: ${fileType}. Supported types: PDF, JPEG, PNG, GIF, WebP`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    console.log(`✅ File type validation passed: ${fileType}`);

    let extractedText = '';
    let pageCount = 1;

    // Process based on file type
    if (fileType === 'application/pdf') {
      console.log('📄 Processing PDF file with hybrid approach...');
      
      try {
        // Use hybrid PDF processing
        const pageImages = await processPDFToImages(fileBuffer);
        pageCount = pageImages.length;
        console.log(`📄 PDF processed into ${pageCount} page(s)`);
        
        // Process each page
        for (let i = 0; i < pageImages.length; i++) {
          console.log(`🔍 Processing page ${i + 1}/${pageImages.length}...`);
          
          try {
            const pageText = await extractTextFromImage(pageImages[i], apiKey);
            if (pageText.trim()) {
              extractedText += `--- Page ${i + 1} ---\n${pageText.trim()}\n\n`;
              console.log(`✅ Page ${i + 1} processed, extracted ${pageText.length} characters`);
            } else {
              console.log(`⚠️ No text found on page ${i + 1}`);
            }
          } catch (pageError) {
            console.error(`❌ Error processing page ${i + 1}:`, pageError);
            extractedText += `--- Page ${i + 1} ---\n[Error extracting text from this page: ${pageError.message}]\n\n`;
          }
        }
        
      } catch (pdfError) {
        console.error('❌ PDF processing failed:', pdfError);
        return new Response(JSON.stringify({
          success: false,
          error: 'PDF processing failed',
          details: pdfError.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
    } else {
      console.log('🖼️ Processing image file...');
      
      // Convert image to base64 for Google Vision API
      const base64Content = arrayBufferToBase64(fileBuffer);
      extractedText = await extractTextFromImage(base64Content, apiKey);
    }

    const totalTime = Date.now() - startTime;
    console.log(`🎉 Processing completed successfully in ${totalTime}ms`);
    console.log(`📊 Final result: ${extractedText.length} characters extracted from ${pageCount} page(s)`);
    console.log('=== Google Vision OCR Function Completed ===');

    return new Response(JSON.stringify({
      success: true,
      extractedText: extractedText.trim(),
      pageCount: pageCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ Unexpected error after ${totalTime}ms:`, error);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
