
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Upload, Copy, Trash2, FileText, Clock, Hash } from 'lucide-react';
import { extractDirectPdfText, ExtractionResult } from '@/utils/extractionUtils';
import { toast } from 'sonner';

const PdfTextExtractor = () => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ExtractionResult | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setExtractedText('');
      setResult(null);
      setProgress(0);
    } else {
      toast.error('Please select a valid PDF file');
    }
  };

  const handleExtractText = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    
    try {
      const result = await extractDirectPdfText(file, setProgress);
      setExtractedText(result.text);
      setResult(result);
      toast.success('Text extracted successfully!');
    } catch (error) {
      console.error('Error extracting text:', error);
      toast.error('Failed to extract text from PDF');
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
          <FileText className="w-5 h-5 text-blue-600" />
          Direct PDF Text Extraction
        </CardTitle>
        <CardDescription>
          Extract native text content directly from PDF files using PDF.js. 
          Best for PDFs with selectable text content.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Click to upload or drag and drop a PDF file
              </p>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
              >
                Select PDF File
              </label>
            </div>
            {file && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm font-medium text-blue-900">
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
              {isProcessing ? 'Extracting...' : 'Extract Text'}
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
                <span>Processing...</span>
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
              <Hash className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Pages</p>
                <p className="text-xs text-gray-600">{result.pageCount} pages</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
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

export default PdfTextExtractor;
