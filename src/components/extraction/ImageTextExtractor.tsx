
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LanguageSelector from './LanguageSelector';
import { extractTextFromImage } from '@/lib/imageUtils';

const ImageTextExtractor: React.FC = () => {
  const [extractedText, setExtractedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('eng');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    // Validate image file type
    if (file && file.type.startsWith('image/')) {
      setIsLoading(true);
      try {
        // Direct OCR on image file
        const text = await extractTextFromImage(file, language);
        setExtractedText(text);
      } catch (error) {
        console.error('Error extracting text from image:', error);
        setExtractedText('Error extracting text from image. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setExtractedText('Please upload a valid image file.');
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Image Text Extractor</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Input
              type="file"
              accept="image/*"
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

export default ImageTextExtractor;
