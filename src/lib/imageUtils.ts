
import { createWorker } from 'tesseract.js';

export async function extractTextFromImage(imageData: string | File, language: string = 'eng'): Promise<string> {
  // Create Tesseract worker with language directly (v6 API)
  const worker = await createWorker(language);
  
  // Perform OCR on the image data
  const { data: { text } } = await worker.recognize(imageData);
  
  // Clean up worker to free memory
  await worker.terminate();
  
  return text;
}
