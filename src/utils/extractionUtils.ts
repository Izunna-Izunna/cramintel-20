import { createWorker, Worker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import { extractTextFromImage } from '@/lib/imageUtils';

// Configure PDF.js worker - Use jsDelivr CDN for better reliability
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

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
    const arrayBuffer = await file.arrayBuffer();
    console.log('File loaded into array buffer');
    
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    console.log('PDF document loaded successfully, pages:', pdf.numPages);
    
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
    
    // Check if it's a worker loading error
    if (error.message.includes('worker') || error.message.includes('fetch')) {
      throw new Error('PDF worker failed to load. Please check your internet connection and try again.');
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
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
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
      }
      
      if (onProgress) {
        onProgress((i / numPages) * 100);
      }
    }
    
    await worker.terminate();
    
    const processingTime = Date.now() - startTime;
    const avgConfidence = numPages > 0 ? totalConfidence / numPages : 0;
    
    return {
      text: fullText.trim(),
      confidence: avgConfidence,
      processingTime,
      pageCount: numPages,
      method: 'PDF to Image OCR'
    };
  } catch (error) {
    console.error('PDF to image OCR failed:', error);
    throw new Error(`PDF to image OCR failed: ${error.message}`);
  }
}
