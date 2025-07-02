
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

interface PageResult {
  pageNumber: number;
  text: string;
  confidence?: number;
}

interface ProcessingResult {
  success: boolean;
  extractedText: string;
  totalPages: number;
  pageResults: PageResult[];
  metadata: {
    processedAt: string;
    fileType: string;
    confidence?: number;
  };
  error?: string;
}

const GoogleVisionExtractor: React.FC = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Please select a valid image (JPEG, PNG) or PDF file');
        setFile(null);
        return;
      }
      
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setError('');
      setResult(null);
      toast.success('File selected successfully');
    }
  };

  const uploadFileToStorage = async (file: File): Promise<string> => {
    if (!user) {
      throw new Error('User must be authenticated to upload files');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${user.id}/google-vision/${fileName}`;

    const { error } = await supabase.storage
      .from('cramintel-materials')
      .upload(filePath, file);

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    return filePath;
  };

  const handleUpload = async () => {
    if (!user) {
      setError('Please sign in to use text extraction');
      return;
    }

    if (!file) {
      setError('Please select a file first');
      return;
    }

    setProcessing(true);
    setError('');
    setResult(null);
    setProgress('Uploading file...');

    try {
      // Upload file to storage
      setProgress('Uploading to storage...');
      const filePath = await uploadFileToStorage(file);

      setProgress('Converting and processing with OCR...');
      
      // Call the edge function
      const { data, error: functionError } = await supabase.functions.invoke('google-vision-ocr', {
        body: { filePath }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Failed to extract text');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Transform the response to match our interface
      const transformedResult: ProcessingResult = {
        success: true,
        extractedText: data.extractedText || '',
        totalPages: data.pages || 1,
        pageResults: data.pages > 1 ? 
          // For multi-page PDFs, split by page markers
          data.extractedText.split('--- Page ').slice(1).map((pageText: string, index: number) => ({
            pageNumber: index + 1,
            text: pageText.replace(/^\d+ ---\n/, '').trim(),
            confidence: data.confidence
          })) :
          // For single page or images
          [{
            pageNumber: 1,
            text: data.extractedText || '',
            confidence: data.confidence
          }],
        metadata: {
          processedAt: new Date().toISOString(),
          fileType: data.fileType || (file.type === 'application/pdf' ? 'pdf' : 'image'),
          confidence: data.confidence
        }
      };

      setResult(transformedResult);
      setProgress('');
      toast.success('Text extracted successfully!');
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to extract text';
      setError(`Error: ${errorMessage}`);
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
      setProgress('');
    }
  };

  const downloadText = () => {
    if (!result?.extractedText) return;
    
    const blob = new Blob([result.extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name.replace(/\.[^/.]+$/, '') || 'extracted'}_text.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Text file downloaded!');
  };

  const handleClear = () => {
    setFile(null);
    setResult(null);
    setError('');
    setProgress('');
    // Reset file input
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    toast.success('Cleared successfully');
  };

  // Show sign-in message if user is not authenticated
  if (!user) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Google Cloud Vision Text Extractor
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-4">
            Please sign in to use the Google Cloud Vision text extraction feature.
          </p>
          <Button onClick={() => window.location.href = '/auth'}>
            Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">PDF OCR Processor</h1>
        <p className="text-gray-600">Convert PDF documents and images to text using Google Cloud Vision OCR</p>
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-2 text-gray-500" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">PDF, JPEG, PNG files (max 10MB)</p>
            </div>
            <input
              id="file-input"
              type="file"
              className="hidden"
              accept=".pdf,.jpeg,.jpg,.png"
              onChange={handleFileSelect}
            />
          </label>
        </div>
        
        {file && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <FileText className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm text-blue-800">{file.name}</span>
              <span className="text-xs text-blue-600 ml-2">
                ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={handleUpload}
          disabled={!file || processing}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
        >
          {processing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5 mr-2" />
              Extract Text
            </>
          )}
        </button>
        <Button
          variant="outline"
          onClick={handleClear}
          disabled={processing}
          className="px-6"
        >
          Clear
        </Button>
      </div>

      {/* Progress */}
      {progress && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <Loader2 className="w-4 h-4 text-blue-600 mr-2 animate-spin" />
            <span className="text-sm text-blue-800">{progress}</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center mb-2">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="font-semibold text-green-800">Processing Complete!</span>
            </div>
            <div className="text-sm text-green-700">
              <p>Total pages processed: {result.totalPages}</p>
              <p>Processed at: {new Date(result.metadata.processedAt).toLocaleString()}</p>
              {result.metadata.confidence && (
                <p>Average confidence: {Math.round(result.metadata.confidence * 100)}%</p>
              )}
            </div>
          </div>

          {/* Page Results Summary */}
          {result.pageResults.length > 1 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">Page Results:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {result.pageResults.map((page) => (
                  <div key={page.pageNumber} className="bg-white p-3 rounded border">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Page {page.pageNumber}</span>
                      <span className="text-sm text-gray-500">
                        {page.text.length} chars
                      </span>
                    </div>
                    {page.confidence && (
                      <div className="text-xs text-gray-600">
                        Confidence: {(page.confidence * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extracted Text */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-800">Extracted Text:</h3>
              <button
                onClick={downloadText}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded transition-colors"
              >
                Download Text
              </button>
            </div>
            <div className="bg-white p-4 rounded border max-h-96 overflow-y-auto">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                {result.extractedText || 'No text extracted'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleVisionExtractor;
