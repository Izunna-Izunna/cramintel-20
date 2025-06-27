
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Copy, Trash2, Image, Clock, Zap } from 'lucide-react';
import { extractTextFromImage, ExtractionResult, supportedLanguages } from '@/utils/extractionUtils';
import { toast } from 'sonner';

const ImageTextExtractor = () => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [language, setLanguage] = useState('eng');
  const [result, setResult] = useState<ExtractionResult | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setExtractedText('');
      setResult(null);
      setProgress(0);
    } else {
      toast.error('Please select a valid image file');
    }
  };

  const handleExtractText = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    
    try {
      const result = await extractTextFromImage(file, language, setProgress);
      setExtractedText(result.text);
      setResult(result);
      toast.success('Text extracted successfully!');
    } catch (error) {
      console.error('Error extracting text:', error);
      toast.error('Failed to extract text from image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(extractedText);
    toast.success('Text copied to clipboard!');
  };

  const handleClearText = () => {
    setExtractedText('');
    setResult(null);
    setFile(null);
    setProgress(0);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="w-5 h-5 text-green-600" />
          Image OCR Text Extraction
        </CardTitle>
        <CardDescription>
          Extract text from images using Tesseract.js OCR technology. 
          Supports multiple languages and various image formats.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Language</label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {supportedLanguages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Click to upload or drag and drop an image file
              </p>
              <p className="text-xs text-gray-500">
                Supports JPG, PNG, GIF, BMP, TIFF formats
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer"
              >
                Select Image File
              </label>
            </div>
            {file && (
              <div className="mt-4 p-3 bg-green-50 rounded-md">
                <p className="text-sm font-medium text-green-900">
                  {file.name} ({Math.round(file.size / 1024)} KB)
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleExtractText}
              disabled={!file || isProcessing}
              className="flex-1"
            >
              {isProcessing ? 'Processing...' : 'Extract Text'}
            </Button>
            {extractedText && (
              <>
                <Button variant="outline" onClick={handleCopyText}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={handleClearText}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing image...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </div>

        {result && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Processing Time</p>
                <p className="text-xs text-gray-600">{result.processingTime}ms</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Confidence</p>
                <p className="text-xs text-gray-600">{Math.round(result.confidence || 0)}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Characters</p>
                <p className="text-xs text-gray-600">{extractedText.length}</p>
              </div>
            </div>
          </div>
        )}

        {extractedText && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Extracted Text:</label>
              <Badge variant="secondary">{result?.method}</Badge>
            </div>
            <Textarea
              value={extractedText}
              readOnly
              className="min-h-[300px] font-mono text-sm"
              placeholder="Extracted text will appear here..."
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageTextExtractor;
