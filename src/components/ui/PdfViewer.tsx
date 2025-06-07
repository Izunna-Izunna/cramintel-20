
import React, { useState, useEffect } from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PdfViewerProps {
  sourceUrl: string;
  initialPage?: number;
  showControls?: boolean;
  height?: string;
  className?: string;
}

export function PdfViewer({ 
  sourceUrl, 
  initialPage = 1, 
  showControls = true, 
  height = '600px',
  className = '' 
}: PdfViewerProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [pageInput, setPageInput] = useState(initialPage.toString());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Validate URL
  useEffect(() => {
    if (!sourceUrl || sourceUrl.trim() === '') {
      setError('No PDF source URL provided');
      setLoading(false);
      return;
    }

    try {
      new URL(sourceUrl);
    } catch {
      // Could be a relative path, which is also valid
      if (!sourceUrl.startsWith('/') && !sourceUrl.startsWith('./')) {
        setError('Invalid PDF source URL format');
        setLoading(false);
        return;
      }
    }

    setError(null);
  }, [sourceUrl]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!showControls) return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          handlePrevPage();
          break;
        case 'ArrowRight':
          event.preventDefault();
          handleNextPage();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, showControls]);

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => [],
    toolbarPlugin: {
      fullScreenPlugin: {},
      getFilePlugin: {
        fileNameGenerator: (file) => {
          const fileName = sourceUrl.split('/').pop() || 'document.pdf';
          return fileName.replace(/\.[^/.]+$/, '');
        },
      },
      printPlugin: {},
      rotatePlugin: {},
      scrollModePlugin: {},
      selectionModePlugin: {},
      themePlugin: {},
      zoomPlugin: {},
    },
  });

  const handleDocumentLoad = (e: any) => {
    setTotalPages(e.doc.numPages);
    setLoading(false);
    setError(null);
  };

  const handlePageChange = (e: any) => {
    setCurrentPage(e.currentPage + 1); // PDF.js uses 0-based indexing
    setPageInput((e.currentPage + 1).toString());
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      setPageInput(newPage.toString());
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      setPageInput(newPage.toString());
    }
  };

  const handleJumpToPage = () => {
    const pageNum = parseInt(pageInput);
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    } else {
      setPageInput(currentPage.toString());
      toast({
        title: "Invalid Page Number",
        description: `Please enter a page number between 1 and ${totalPages}`,
        variant: "destructive"
      });
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    // Force re-render by updating a key or similar mechanism
    window.location.reload();
  };

  const handleLoadError = () => {
    console.error('PDF loading error for URL:', sourceUrl);
    setLoading(false);
    setError('Failed to load PDF document. Please check the file URL and try again.');
    
    toast({
      title: "PDF Loading Error",
      description: "Unable to load the PDF document. The file may be corrupted or inaccessible.",
      variant: "destructive"
    });
  };

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 border border-gray-200 rounded-lg ${className}`} style={{ height }}>
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">📄</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Failed to Load PDF</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRetry} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`pdf-viewer-container ${className}`}>
      {showControls && !loading && (
        <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={handleJumpToPage}
                onKeyDown={(e) => e.key === 'Enter' && handleJumpToPage()}
                className="w-16 text-center text-sm"
                min="1"
                max={totalPages}
                aria-label="Current page number"
              />
              <span className="text-sm text-gray-600">
                of {totalPages}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="text-xs text-gray-500">
            Use ← → keys to navigate
          </div>
        </div>
      )}

      <div 
        className="pdf-viewer-content" 
        style={{ height: showControls ? `calc(${height} - 60px)` : height }}
      >
        {loading && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mb-4"></div>
            <p className="text-gray-600">Loading PDF...</p>
          </div>
        )}

        <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
          <div 
            style={{ display: loading ? 'none' : 'block' }}
            onError={handleLoadError}
          >
            <Viewer
              fileUrl={sourceUrl}
              plugins={[defaultLayoutPluginInstance]}
              onDocumentLoad={handleDocumentLoad}
              onPageChange={handlePageChange}
              initialPage={initialPage - 1}
              defaultScale={1}
            />
          </div>
        </Worker>
      </div>
    </div>
  );
}
