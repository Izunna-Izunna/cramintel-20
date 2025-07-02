
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, FileText, Image, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import toast from 'react-hot-toast';

interface ExtractionResult {
  text: string;
  confidence?: number;
  pages?: number;
  wordCount?: number;
}

const GoogleVisionExtractor: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please select a valid image (JPEG, PNG) or PDF file');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
      toast.success('File selected successfully');
    }
  };

  const uploadFileToStorage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `google-vision/${fileName}`;

    const { error } = await supabase.storage
      .from('cramintel-materials')
      .upload(filePath, file);

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    return filePath;
  };

  const handleExtractText = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading('Extracting text...');

    try {
      // Upload file to storage
      const filePath = await uploadFileToStorage(selectedFile);

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('google-vision-ocr', {
        body: { filePath }
      });

      if (error) {
        throw new Error(error.message || 'Failed to extract text');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setExtractedText(data.extractedText || '');
      setExtractionResult({
        text: data.extractedText || '',
        confidence: data.confidence,
        pages: data.pages,
        wordCount: data.extractedText ? data.extractedText.split(/\s+/).length : 0
      });

      toast.success('Text extracted successfully!');
    } catch (error) {
      console.error('Error extracting text:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to extract text');
      setExtractedText('');
      setExtractionResult(null);
    } finally {
      toast.dismiss(loadingToast);
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!extractedText) return;
    
    try {
      await navigator.clipboard.writeText(extractedText);
      toast.success('Text copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy text to clipboard');
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setExtractedText('');
    setExtractionResult(null);
    // Reset file input
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    toast.success('Cleared successfully');
  };

  const getFileIcon = () => {
    if (!selectedFile) return <FileText className="w-8 h-8 text-gray-400" />;
    
    if (selectedFile.type.startsWith('image/')) {
      return <Image className="w-8 h-8 text-blue-500" />;
    }
    return <FileText className="w-8 h-8 text-red-500" />;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="w-6 h-6" />
          Google Cloud Vision Text Extractor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
          <div className="flex flex-col items-center space-y-4">
            {getFileIcon()}
            <div>
              <Input
                id="file-input"
                type="file"
                accept=".jpeg,.jpg,.png,.pdf"
                onChange={handleFileSelect}
                disabled={isLoading}
                className="max-w-sm"
              />
              <p className="text-sm text-gray-500 mt-2">
                Supported formats: JPEG, PNG, PDF (max 10MB)
              </p>
            </div>
            {selectedFile && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{selectedFile.name}</span>
                <Badge variant="outline">
                  {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={handleExtractText}
            disabled={!selectedFile || isLoading}
            className="min-w-32"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Extracting...
              </>
            ) : (
              'Extract Text'
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={isLoading}
          >
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>

        {/* Results Section */}
        {extractionResult && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                Words: {extractionResult.wordCount}
              </Badge>
              {extractionResult.confidence && (
                <Badge variant="secondary">
                  Confidence: {Math.round(extractionResult.confidence * 100)}%
                </Badge>
              )}
              {extractionResult.pages && (
                <Badge variant="secondary">
                  Pages: {extractionResult.pages}
                </Badge>
              )}
            </div>

            {/* Extracted Text */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Extracted Text:</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyToClipboard}
                  disabled={!extractedText}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
              <Textarea
                value={extractedText}
                readOnly
                rows={12}
                placeholder="Extracted text will appear here..."
                className="font-mono text-sm"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleVisionExtractor;
