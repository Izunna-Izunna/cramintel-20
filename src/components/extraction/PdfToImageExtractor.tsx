
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as pdfjsLib from 'pdfjs-dist';
import { extractTextFromImage } from '@/lib/imageUtils';
import LanguageSelector from './LanguageSelector';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const PdfToImageExtractor: React.FC = () => {
  const [extractedText, setExtractedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('eng');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (file && file.type === 'application/pdf') {
      setIsLoading(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        // Process each page
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          
          // Create viewport with 1.5x scale for better OCR quality
          const viewport = page.getViewport({ scale: 1.5 });
          
          // Create canvas to render PDF page
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) continue;
          
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          // Render PDF page to canvas
          await page.render({ canvasContext: context, viewport: viewport }).promise;
          
          // Convert canvas to image data URL
          const imageData = canvas.toDataURL('image/png');
          
          // Perform OCR on the rendered page image
          const pageText = await extractTextFromImage(imageData, language);
          if (pageText.trim()) {
            fullText += `Page ${i}:\n${pageText}\n\n`;
          }
        }

        setExtractedText(fullText.trim());
      } catch (error) {
        console.error('Error extracting text from PDF:', error);
        setExtractedText('Error extracting text from PDF. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setExtractedText('Please upload a valid PDF file.');
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>PDF to Image Text Extractor</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={isLoading}
            />
            <LanguageSelector value={language} onChange={setLanguage} />
          </div>
          <Textarea
            value={isLoading ? 'Extracting text...' : extractedText}
            readOnly
            rows={10}
            placeholder="Extracted text will appear here..."
          />
          <Button
            onClick={() => setExtractedText('')}
            disabled={isLoading || !extractedText}
          >
            Clear Text
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PdfToImageExtractor;
