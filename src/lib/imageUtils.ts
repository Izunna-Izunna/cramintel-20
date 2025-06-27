
import { createWorker } from 'tesseract.js';

export async function extractTextFromImage(imageData: string, language: string = 'eng'): Promise<string> {
  const worker = await createWorker();
  await worker.loadLanguage(language);
  await worker.initialize(language);
  const { data: { text } } = await worker.recognize(imageData);
  await worker.terminate(); // Always terminate to free memory
  return text;
}
