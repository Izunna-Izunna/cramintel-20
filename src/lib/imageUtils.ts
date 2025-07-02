
import { createWorker } from 'tesseract.js';

export async function extractTextFromImage(imageData: string | File, language: string = 'eng'): Promise<string> {
  // Create Tesseract worker
  const worker = await createWorker();
  
  // Load and initialize the specified language
  await worker.loadLanguage(language);
  await worker.initialize(language);
  
  // Perform OCR on the image data
  const { data: { text } } = await worker.recognize(imageData);
  
  // Clean up worker to free memory
  await worker.terminate();
  
  return text;
}
