
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as pdfjsLib from 'pdfjs-dist';
import { extractTextFromImage } from '@/lib/imageUtils';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const PdfTextExtractor: React.FC = () => {
  const [extractedText, setExtractedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    // Validate file type
    if (file && file.type === 'application/pdf') {
      setIsLoading(true);
      try {
        // Convert file to ArrayBuffer for PDF.js
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        // Process each page
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          
          // Extract native text content
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n\n';

          // Extract text from embedded images using OCR
          try {
            const operatorList = await page.getOperatorList();
            for (let j = 0; j < operatorList.fnArray.length; j++) {
              if (operatorList.fnArray[j] === pdfjsLib.OPS.paintImageXObject) {
                const imageIndex = operatorList.argsArray[j][0];
                const image = await page.objs.get(imageIndex);
                if (image && image.src) {
                  const imageText = await extractTextFromImage(image.src);
                  if (imageText.trim()) {
                    fullText += `[Image Text: ${imageText}]\n\n`;
                  }
                }
              }
            }
          } catch (imageError) {
            console.warn('Error extracting images from page', i, ':', imageError);
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
        <CardTitle>PDF Text Extractor</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={isLoading}
          />
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

export default PdfTextExtractor;
