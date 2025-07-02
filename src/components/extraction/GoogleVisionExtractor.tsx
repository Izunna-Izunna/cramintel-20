
import React, { useState } from 'react';
import { Upload, FileText, Download, Loader2, AlertCircle } from 'lucide-react';

// Configuration - using your actual Supabase values
const SUPABASE_URL = 'https://bccelkcfjpiuabvkcytj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjY2Vsa2NmanBpdWFidmtjeXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4ODIxODcsImV4cCI6MjA1NzQ1ODE4N30.Y39av86ORWxMQZ_xgoFNqX9YYj25owKimduR4ek1ZTs';

interface ApiResponse {
  success: boolean;
  extractedText?: string;
  error?: string;
  details?: string;
}

const GoogleVisionExtractor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const validateAndSetFile = (selectedFile: File) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Please select a PDF, JPEG, PNG, GIF, or WebP file.');
      return;
    }
    
    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      return;
    }
    
    setFile(selectedFile);
    setError('');
    setExtractedText('');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const uploadFile = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setIsUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      console.log('Starting upload process...');
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // First, let's try the JSON method (more reliable with Supabase Edge Functions)
      setUploadProgress(10);
      
      try {
        console.log('Trying JSON upload method...');
        const success = await uploadAsBase64();
        if (success) {
          console.log('JSON upload successful!');
          return;
        }
      } catch (jsonError) {
        console.log('JSON method failed, trying FormData...', jsonError);
      }
      
      setUploadProgress(25);
      
      // Fallback to FormData method
      console.log('Trying FormData upload method...');
      const formData = new FormData();
      formData.append('file', file);
      
      // Log the FormData contents
      for (let [key, value] of formData.entries()) {
        console.log('FormData entry:', key, typeof value, value instanceof File ? 'File object' : value);
      }
      
      setUploadProgress(50);
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/google-vision-ocr`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          // Don't set Content-Type - let browser handle it for FormData
        },
        body: formData,
      });

      setUploadProgress(75);

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Server error (${response.status}): ${errorText}`);
      }

      const result: ApiResponse = await response.json();
      setUploadProgress(100);

      if (result.success) {
        setExtractedText(result.extractedText || '');
        console.log('Text extraction successful!');
      } else {
        throw new Error(result.error || 'Failed to extract text');
      }

    } catch (err) {
      console.error('Upload error:', err);
      setError(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Primary upload method using base64 encoding (more reliable with Supabase)
  const uploadAsBase64 = async (): Promise<boolean> => {
    try {
      console.log('Converting file to base64...');
      
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file!);
      });
      
      const base64Data = await base64Promise;
      console.log('Base64 conversion complete, length:', base64Data.length);
      
      const jsonPayload = {
        file: base64Data,
        fileName: file!.name,
        fileType: file!.type
      };

      console.log('Sending JSON payload:', {
        fileName: jsonPayload.fileName,
        fileType: jsonPayload.fileType,
        fileSize: jsonPayload.file.length
      });

      const response = await fetch(`${SUPABASE_URL}/functions/v1/google-vision-ocr`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonPayload),
      });

      console.log('JSON response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('JSON upload error response:', errorText);
        throw new Error(`JSON upload failed with status ${response.status}: ${errorText}`);
      }

      const result: ApiResponse = await response.json();
      
      if (result.success) {
        setExtractedText(result.extractedText || '');
        setUploadProgress(100);
        console.log('JSON text extraction successful!');
        return true;
      } else {
        throw new Error(result.error || 'JSON extraction failed');
      }
      
    } catch (err) {
      console.error('Base64 upload error:', err);
      throw err; // Re-throw to be handled by caller
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

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">PDF OCR Text Extractor</h1>
        <p className="text-gray-600">Upload a PDF or image to extract text using Google Cloud Vision</p>
      </div>

      {/* File Upload Area */}
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg text-gray-600 mb-2">Click to upload or drag and drop</p>
        <p className="text-sm text-gray-500 mb-4">PDF, JPEG, PNG, GIF, WebP files only (max 10MB)</p>
        
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors"
        >
          <Upload className="h-4 w-4 mr-2" />
          Choose File
        </label>

        {file && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700">
              📄 {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
            </p>
          </div>
        )}
      </div>

      {/* Upload Button */}
      {file && (
        <div className="mt-6 text-center">
          <button
            onClick={uploadFile}
            disabled={isUploading}
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Extract Text from {file.type.includes('pdf') ? 'PDF' : 'Image'}
              </>
            )}
          </button>
        </div>
      )}

      {/* Progress Bar */}
      {isUploading && (
        <div className="mt-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1 text-center">{uploadProgress}% complete</p>
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
            <button
              onClick={downloadText}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Text
            </button>
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
