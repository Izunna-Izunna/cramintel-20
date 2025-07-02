import React, { useState } from 'react';
import { Upload, FileText, Download, Loader2, AlertCircle, CheckCircle, FileX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Configuration
const SUPABASE_URL = 'https://bccelkcfjpiuabvkcytj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjY2Vsa2NmanBpdWFidmtjeXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4ODIxODcsImV4cCI6MjA1NzQ1ODE4N30.Y39av86ORWxMQZ_xgoFNqX9YYj25owKimduR4ek1ZTs';

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB client-side limit
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];

interface ApiResponse {
  success: boolean;
  extractedText?: string;
  error?: string;
  details?: string;
  pageCount?: number;
}

const GoogleVisionExtractor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [error, setError] = useState('');
  const [processingStep, setProcessingStep] = useState('');
  const [pageCount, setPageCount] = useState<number | null>(null);
  const { toast } = useToast();

  const validateFile = (selectedFile: File): { valid: boolean; error?: string } => {
    console.log(`Validating file: ${selectedFile.name}, size: ${selectedFile.size}, type: ${selectedFile.type}`);
    
    // Check file type
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      return {
        valid: false,
        error: `Invalid file type: ${selectedFile.type}. Please select a PDF, JPEG, PNG, GIF, or WebP file.`
      };
    }
    
    // Check file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size (${(selectedFile.size / 1024 / 1024).toFixed(2)}MB) exceeds the maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB.`
      };
    }
    
    return { valid: true };
  };

  const handleFileSelection = (selectedFile: File) => {
    console.log('File selected:', selectedFile.name);
    
    const validation = validateFile(selectedFile);
    if (!validation.valid) {
      setError(validation.error!);
      setFile(null);
      toast({
        title: "Invalid File",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }
    
    setFile(selectedFile);
    setError('');
    setExtractedText('');
    setPageCount(null);
    console.log('File validation passed');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      handleFileSelection(selectedFile);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelection(droppedFile);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const processFile = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    console.log('Starting file processing...');
    setIsProcessing(true);
    setError('');
    
    // Set appropriate processing steps based on file type
    if (file.type === 'application/pdf') {
      setProcessingStep('Analyzing PDF structure and content...');
    } else {
      setProcessingStep('Preparing image for text extraction...');
    }

    try {
      console.log('Converting file to base64...');
      
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
      
      const base64Data = await base64Promise;
      console.log(`Base64 conversion complete, length: ${base64Data.length}`);
      
      if (file.type === 'application/pdf') {
        setProcessingStep('Processing PDF with hybrid text extraction...');
      } else {
        setProcessingStep('Analyzing image with Google Vision API...');
      }
      
      const jsonPayload = {
        file: base64Data,
        fileName: file.name,
        fileType: file.type
      };

      console.log('Sending request to Edge Function...');
      const response = await fetch(`${SUPABASE_URL}/functions/v1/google-vision-ocr`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonPayload),
      });

      console.log(`Edge Function response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge Function error:', errorText);
        throw new Error(`Server error (${response.status}): ${errorText}`);
      }

      setProcessingStep('Processing API response...');
      const result: ApiResponse = await response.json();
      console.log('API response:', result);

      if (result.success) {
        setExtractedText(result.extractedText || '');
        setPageCount(result.pageCount || null);
        setProcessingStep('');
        console.log('Text extraction successful!');
        
        const successMessage = file.type === 'application/pdf' 
          ? `Successfully extracted text from ${result.pageCount || 1} page(s) of ${file.name} using hybrid PDF processing`
          : `Successfully extracted ${result.extractedText?.length || 0} characters from ${file.name}`;
        
        toast({
          title: "Success!",
          description: successMessage,
        });
      } else {
        throw new Error(result.error || 'Failed to extract text');
      }

    } catch (err) {
      console.error('Processing error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Processing failed: ${errorMessage}`);
      
      toast({
        title: "Processing Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const downloadText = () => {
    if (!extractedText) return;
    
    const blob = new Blob([extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file!.name.replace(/\.[^/.]+$/, '')}_extracted_text.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number): string => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Google Vision OCR Text Extractor</h1>
        <p className="text-gray-600">Upload PDFs or images to extract text using Google Cloud Vision API with smart hybrid processing</p>
        <div className="mt-2 text-sm text-gray-500">
          Maximum file size: {MAX_FILE_SIZE / 1024 / 1024}MB | Supports: PDF, JPEG, PNG, GIF, WebP
        </div>
        <div className="mt-1 text-xs text-blue-600 font-medium">
          ✨ PDFs are processed using intelligent hybrid text extraction for optimal results
        </div>
      </div>

      {/* File Upload Area */}
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg text-gray-600 mb-2">Click to upload or drag and drop</p>
        <p className="text-sm text-gray-500 mb-4">PDF, JPEG, PNG, GIF, WebP files only (max {MAX_FILE_SIZE / 1024 / 1024}MB)</p>
        
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
          disabled={isProcessing}
        />
        <label
          htmlFor="file-upload"
          className={`inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors ${
            isProcessing ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Upload className="h-4 w-4 mr-2" />
          Choose File
        </label>

        {file && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-700">
                {file.type === 'application/pdf' ? '📄' : '🖼️'} {file.name} ({formatFileSize(file.size)})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Process Button */}
      {file && !extractedText && (
        <div className="mt-6 text-center">
          <button
            onClick={processFile}
            disabled={isProcessing}
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {file.type === 'application/pdf' ? 'Processing PDF...' : 'Processing...'}
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Extract Text
              </>
            )}
          </button>
        </div>
      )}

      {/* Processing Status */}
      {processingStep && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center">
            <Loader2 className="h-5 w-5 text-blue-600 mr-2 animate-spin" />
            <p className="text-blue-700 font-medium">{processingStep}</p>
          </div>
          {file?.type === 'application/pdf' && (
            <div className="mt-2 space-y-1">
              <p className="text-sm text-blue-600">
                📄 Using smart hybrid processing: attempting direct text extraction first, then falling back to image analysis if needed
              </p>
              <p className="text-xs text-blue-500">
                This approach ensures optimal results for both text-based and scanned PDFs
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Extracted Text Display */}
      {extractedText && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Extracted Text</h2>
            <div className="flex gap-4 items-center">
              {pageCount && pageCount > 1 && (
                <span className="text-sm text-gray-600">
                  {pageCount} pages processed
                </span>
              )}
              <span className="text-sm text-gray-600">
                {extractedText.length} characters
              </span>
              <button
                onClick={downloadText}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </button>
            </div>
          </div>
          <div className="border rounded-md p-4 bg-gray-50 max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
              {extractedText}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleVisionExtractor;
