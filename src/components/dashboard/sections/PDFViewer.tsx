
import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, X, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Set up PDF.js worker with improved error handling
const setupPDFWorker = () => {
  try {
    // Use jsDelivr CDN with explicit version
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
    console.log('PDF.js worker initialized with version:', pdfjs.version);
  } catch (error) {
    console.error('Failed to set PDF.js worker:', error);
    // Fallback: Try unpkg as backup
    try {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
      console.log('PDF.js worker fallback initialized');
    } catch (fallbackError) {
      console.error('Fallback PDF.js worker also failed:', fallbackError);
    }
  }
};

// Initialize worker
setupPDFWorker();

interface PDFViewerProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
}

export function PDFViewer({ isOpen, onClose, fileUrl, fileName }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (isOpen) {
      console.log('PDF Viewer opened with URL:', fileUrl);
      setLoading(true);
      setError(null);
      
      // Set a timeout for loading
      const timeout = setTimeout(() => {
        console.log('PDF loading timeout reached');
        setLoading(false);
        setError('PDF loading is taking too long. Please try downloading the file instead.');
      }, 30000); // 30 second timeout
      
      setLoadingTimeout(timeout);
    }
    
    return () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        setLoadingTimeout(null);
      }
    };
  }, [isOpen, fileUrl]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log('PDF loaded successfully with', numPages, 'pages');
    setNumPages(numPages);
    setLoading(false);
    setError(null);
    
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      setLoadingTimeout(null);
    }
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    console.error('PDF URL that failed:', fileUrl);
    setLoading(false);
    
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      setLoadingTimeout(null);
    }
    
    // Provide more specific error messages
    let errorMessage = "Unable to load the PDF file.";
    
    if (error.message.includes('worker')) {
      errorMessage = "PDF viewer initialization failed. Please try refreshing the page.";
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorMessage = "Network error while loading PDF. Please check your connection.";
    } else if (error.message.includes('invalid') || error.message.includes('corrupt')) {
      errorMessage = "The PDF file appears to be corrupted or invalid.";
    }
    
    setError(errorMessage);
    
    toast({
      title: "Error Loading PDF",
      description: errorMessage + " You can still download the file.",
      variant: "destructive"
    });
  };

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const downloadFile = () => {
    console.log('Downloading file:', fileName);
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const retryLoading = () => {
    console.log('Retrying PDF load');
    setError(null);
    setLoading(true);
    setupPDFWorker();
    
    // Reset the timeout
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
    }
    
    const timeout = setTimeout(() => {
      setLoading(false);
      setError('PDF loading is taking too long. Please try downloading the file instead.');
    }, 30000);
    
    setLoadingTimeout(timeout);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold truncate">{fileName}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={downloadFile}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Controls */}
        {!error && !loading && (
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPrevPage} disabled={pageNumber <= 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600">
                Page {pageNumber} of {numPages || '?'}
              </span>
              <Button variant="outline" size="sm" onClick={goToNextPage} disabled={pageNumber >= numPages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={zoomOut} disabled={scale <= 0.5}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600 min-w-[60px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button variant="outline" size="sm" onClick={zoomIn} disabled={scale >= 3.0}>
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto bg-gray-100 flex flex-col justify-center items-center p-4">
          {error ? (
            <div className="max-w-md w-full">
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={retryLoading}>
                  Try Again
                </Button>
                <Button onClick={downloadFile}>
                  Download PDF
                </Button>
              </div>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
              <p className="text-gray-600">Loading PDF...</p>
              <p className="text-xs text-gray-500 text-center max-w-md">
                If this takes too long, you can download the file directly using the button above.
              </p>
            </div>
          ) : (
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading=""
              className="flex justify-center"
              options={{
                cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/cmaps/`,
                cMapPacked: true,
              }}
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                className="shadow-lg"
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
