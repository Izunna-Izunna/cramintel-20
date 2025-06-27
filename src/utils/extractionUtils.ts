import { createWorker, Worker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import { extractTextFromImage } from '@/lib/imageUtils';

// Configure PDF.js worker with fallback options
const configureWorker = () => {
  console.log('Configuring PDF.js worker...');
  
  // Primary worker source - jsDelivr CDN
  const primaryWorkerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
  
  // Fallback worker source - unpkg CDN
  const fallbackWorkerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
  
  console.log('Primary worker URL:', primaryWorkerSrc);
  console.log('Fallback worker URL:', fallbackWorkerSrc);
  
  // Set the primary worker source
  pdfjsLib.GlobalWorkerOptions.workerSrc = primaryWorkerSrc;
  
  return { primaryWorkerSrc, fallbackWorkerSrc };
};

// Initialize worker configuration
const { primaryWorkerSrc, fallbackWorkerSrc } = configureWorker();

export interface ExtractionResult {
  text: string;
  confidence?: number;
  processingTime: number;
  pageCount?: number;
  method: string;
}

export const supportedLanguages = [
  { code: 'eng', name: 'English' },
  { code: 'fra', name: 'French' },
  { code: 'deu', name: 'German' },
  { code: 'spa', name: 'Spanish' },
  { code: 'ita', name: 'Italian' },
  { code: 'por', name: 'Portuguese' },
  { code: 'rus', name: 'Russian' },
  { code: 'chi_sim', name: 'Chinese (Simplified)' },
  { code: 'jpn', name: 'Japanese' },
  { code: 'kor', name: 'Korean' },
  { code: 'ara', name: 'Arabic' },
  { code: 'hin', name: 'Hindi' },
];

export async function extractTextFromImageFile(
  imageData: string | File, 
  language: string = 'eng',
  onProgress?: (progress: number) => void
): Promise<ExtractionResult> {
  const startTime = Date.now();
  
  try {
    // Use the new v6 API - create worker with language directly
    const worker = await createWorker(language, 1, {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(m.progress * 100);
        }
      }
    });
    
    const { data: { text, confidence } } = await worker.recognize(imageData);
    
    await worker.terminate();
    
    const processingTime = Date.now() - startTime;
    
    return {
      text: text.trim(),
      confidence,
      processingTime,
      method: 'Tesseract OCR'
    };
  } catch (error) {
    console.error('OCR extraction failed:', error);
    throw new Error(`OCR extraction failed: ${error.message}`);
  }
}

export async function extractDirectPdfText(
  file: File,
  onProgress?: (progress: number) => void
): Promise<ExtractionResult> {
  const startTime = Date.now();
  
  try {
    console.log('Starting PDF text extraction...');
    console.log('Current worker URL:', pdfjsLib.GlobalWorkerOptions.workerSrc);
    
    const arrayBuffer = await file.arrayBuffer();
    console.log('File loaded into array buffer');
    
    // Test PDF loading with primary worker
    let pdf;
    try {
      pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      console.log('PDF document loaded successfully with primary worker, pages:', pdf.numPages);
    } catch (workerError) {
      console.warn('Primary worker failed, trying fallback:', workerError.message);
      
      // Try fallback worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = fallbackWorkerSrc;
      console.log('Switched to fallback worker:', fallbackWorkerSrc);
      
      pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      console.log('PDF document loaded successfully with fallback worker, pages:', pdf.numPages);
    }
    
    let fullText = '';
    const numPages = pdf.numPages;
    
    for (let i = 1; i <= numPages; i++) {
      if (onProgress) {
        onProgress((i / numPages) * 100);
      }
      
      console.log(`Processing page ${i} of ${numPages}`);
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (pageText) {
        fullText += pageText + '\n\n';
        console.log(`Page ${i} text length:`, pageText.length);
      }

      // Extract text from embedded images
      try {
        const operatorList = await page.getOperatorList();
        for (let j = 0; j < operatorList.fnArray.length; j++) {
          if (operatorList.fnArray[j] === pdfjsLib.OPS.paintImageXObject) {
            const imageIndex = operatorList.argsArray[j][0];
            const image = await page.objs.get(imageIndex);
            if (image && image.src) {
              const imageText = await extractTextFromImage(image.src);
              if (imageText.trim()) {
                fullText += `[Image Text: ${imageText.trim()}]\n\n`;
                console.log(`Extracted text from image on page ${i}`);
              }
            }
          }
        }
      } catch (imageError) {
        console.warn('Error extracting images from page', i, ':', imageError);
      }
    }
    
    const processingTime = Date.now() - startTime;
    console.log('PDF extraction completed. Total text length:', fullText.length);
    
    return {
      text: fullText.trim(),
      processingTime,
      pageCount: numPages,
      method: 'PDF.js Direct Text + Image OCR'
    };
  } catch (error) {
    console.error('PDF text extraction failed:', error);
    console.error('Error details:', error.name, error.message);
    
    // Clear any cached worker configuration
    console.log('Clearing worker cache and resetting configuration...');
    pdfjsLib.GlobalWorkerOptions.workerSrc = primaryWorkerSrc;
    
    // Provide specific error messages
    if (error.message.includes('worker') || error.message.includes('fetch') || error.message.includes('dynamically imported module')) {
      throw new Error('PDF worker failed to load from CDN. Please check your internet connection and try refreshing the page.');
    }
    
    throw new Error(`PDF text extraction failed: ${error.message}`);
  }
}

export async function extractPdfToImageText(
  file: File,
  language: string = 'eng',
  onProgress?: (progress: number) => void
): Promise<ExtractionResult> {
  const startTime = Date.now();
  
  try {
    console.log('Starting PDF to Image OCR extraction...');
    console.log('Current worker URL:', pdfjsLib.GlobalWorkerOptions.workerSrc);
    
    const arrayBuffer = await file.arrayBuffer();
    
    // Test PDF loading with fallback support
    let pdf;
    try {
      pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      console.log('PDF loaded successfully for image conversion, pages:', pdf.numPages);
    } catch (workerError) {
      console.warn('Primary worker failed for PDF to image, trying fallback:', workerError.message);
      
      // Try fallback worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = fallbackWorkerSrc;
      console.log('Switched to fallback worker for PDF to image:', fallbackWorkerSrc);
      
      pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      console.log('PDF loaded successfully with fallback worker for image conversion, pages:', pdf.numPages);
    }
    
    let fullText = '';
    const numPages = pdf.numPages;
    let totalConfidence = 0;
    
    // Use the new v6 API - create worker with language directly
    const worker = await createWorker(language, 1, {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress((m.progress * 100) / numPages);
        }
      }
    });
    
    for (let i = 1; i <= numPages; i++) {
      console.log(`Converting page ${i} to image and processing OCR...`);
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({ canvasContext: context, viewport: viewport }).promise;
      const imageData = canvas.toDataURL('image/png');
      
      const { data: { text, confidence } } = await worker.recognize(imageData);
      
      if (text.trim()) {
        fullText += text.trim() + '\n\n';
        totalConfidence += confidence || 0;
        console.log(`Page ${i} OCR completed, confidence: ${confidence}%`);
      }
      
      if (onProgress) {
        onProgress((i / numPages) * 100);
      }
    }
    
    await worker.terminate();
    
    const processingTime = Date.now() - startTime;
    const avgConfidence = numPages > 0 ? totalConfidence / numPages : 0;
    
    console.log('PDF to Image OCR completed. Total text length:', fullText.length);
    
    return {
      text: fullText.trim(),
      confidence: avgConfidence,
      processingTime,
      pageCount: numPages,
      method: 'PDF to Image OCR'
    };
  } catch (error) {
    console.error('PDF to image OCR failed:', error);
    console.error('Error details:', error.name, error.message);
    
    // Clear any cached worker configuration
    console.log('Clearing worker cache and resetting configuration...');
    pdfjsLib.GlobalWorkerOptions.workerSrc = primaryWorkerSrc;
    
    // Provide specific error messages
    if (error.message.includes('worker') || error.message.includes('fetch') || error.message.includes('dynamically imported module')) {
      throw new Error('PDF worker failed to load from CDN. Please check your internet connection and try refreshing the page.');
    }
    
    throw new Error(`PDF to image OCR failed: ${error.message}`);
  }
}
