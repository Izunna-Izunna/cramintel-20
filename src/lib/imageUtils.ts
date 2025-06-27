
import { createWorker } from 'tesseract.js';

export async function extractTextFromImage(imageData: string, language: string = 'eng'): Promise<string> {
  // Use v6 API - create worker with language directly
  const worker = await createWorker(language);
  const { data: { text } } = await worker.recognize(imageData);
  await worker.terminate(); // Always terminate to free memory
  return text;
}
