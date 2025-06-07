
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Import styles for the PDF viewer
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

interface PdfViewerProps {
  sourceUrl: string;
  initialPage?: number;
  showControls?: boolean;
  className?: string;
  height?: string | number;
}

export function PdfViewer({
  sourceUrl,
  initialPage = 1,
  showControls = true,
  className = '',
  height = '600px'
}: PdfViewerProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jumpToPage, setJumpToPage] = useState(initialPage.toString());
  const viewerRef = useRef<any>(null);
  const { toast } = useToast();

  // Validate URL
  const isValidUrl = useCallback((url: string) => {
    if (!url || url.trim() === '') return false;
    try {
      new URL(url);
      return true;
    } catch {
      // Check if it's a relative path
      return url.startsWith('/') || url.startsWith('./') || url.startsWith('../');
    }
  }, []);

  // Create default layout plugin with custom configuration
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => [],
    toolbarPlugin: {
      fullScreenPlugin: {
        enableShortcuts: true,
      },
      getFilePlugin: {
        fileNameGenerator: (file) => {
          const fileName = sourceUrl.split('/').pop() || 'document.pdf';
          return fileName.includes('.pdf') ? fileName : `${fileName}.pdf`;
        },
      },
      printPlugin: {
        enableShortcuts: true,
      },
      propertiesPlugin: {
        enableShortcuts: true,
      },
      rotatePlugin: {
        enableShortcuts: true,
      },
      scrollModePlugin: {
        enableShortcuts: true,
      },
      selectionModePlugin: {
        enableShortcuts: true,
      },
      themePlugin: {
        enableShortcuts: true,
      },
      zoomPlugin: {
        enableShortcuts: true,
      },
    },
  });

  // Handle document load
  const handleDocumentLoad = useCallback((e: any) => {
    setTotalPages(e.doc.numPages);
    setLoading(false);
    setError(null);
    
    // Jump to initial page if specified
    if (initialPage > 1 && initialPage <= e.doc.numPages) {
      setTimeout(() => {
        if (viewerRef.current) {
          viewerRef.current.jumpToPage(initialPage - 1);
        }
      }, 100);
    }
  }, [initialPage]);

  // Handle page change
  const handlePageChange = useCallback((e: any) => {
    const newPage = e.currentPage + 1; // PDF viewer uses 0-based indexing
    setCurrentPage(newPage);
    setJumpToPage(newPage.toString());
  }, []);

  // Handle load error
  const handleLoadError = useCallback((e: any) => {
    console.error('PDF load error:', e);
    setLoading(false);
    setError('Failed to load PDF document. Please check the URL and try again.');
    toast({
      title: "Error Loading PDF",
      description: "The PDF document could not be loaded.",
      variant: "destructive"
    });
  }, [toast]);

  // Navigation functions
  const goToPrevPage = useCallback(() => {
    if (currentPage > 1 && viewerRef.current) {
      const newPage = currentPage - 1;
      viewerRef.current.jumpToPage(newPage - 1);
      setCurrentPage(newPage);
      setJumpToPage(newPage.toString());
    }
  }, [currentPage]);

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages && viewerRef.current) {
      const newPage = currentPage + 1;
      viewerRef.current.jumpToPage(newPage - 1);
      setCurrentPage(newPage);
      setJumpToPage(newPage.toString());
    }
  }, [currentPage, totalPages]);

  const jumpToSpecificPage = useCallback(() => {
    const pageNum = parseInt(jumpToPage);
    if (pageNum >= 1 && pageNum <= totalPages && viewerRef.current) {
      viewerRef.current.jumpToPage(pageNum - 1);
      setCurrentPage(pageNum);
    } else {
      setJumpToPage(currentPage.toString());
      toast({
        title: "Invalid Page",
        description: `Please enter a page number between 1 and ${totalPages}.`,
        variant: "destructive"
      });
    }
  }, [jumpToPage, totalPages, currentPage, toast]);

  // Zoom functions
  const zoomIn = useCallback(() => {
    const newScale = Math.min(scale + 0.25, 3.0);
    setScale(newScale);
    if (viewerRef.current) {
      viewerRef.current.zoom(newScale);
    }
  }, [scale]);

  const zoomOut = useCallback(() => {
    const newScale = Math.max(scale - 0.25, 0.25);
    setScale(newScale);
    if (viewerRef.current) {
      viewerRef.current.zoom(newScale);
    }
  }, [scale]);

  const handleZoomChange = useCallback((value: string) => {
    const newScale = parseFloat(value);
    setScale(newScale);
    if (viewerRef.current) {
      viewerRef.current.zoom(newScale);
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevPage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNextPage();
          break;
        case '+':
        case '=':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
          e.preventDefault();
          zoomOut();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevPage, goToNextPage, zoomIn, zoomOut]);

  // Reset state when sourceUrl changes
  useEffect(() => {
    setLoading(true);
    setError(null);
    setCurrentPage(initialPage);
    setJumpToPage(initialPage.toString());
    setScale(1.0);
  }, [sourceUrl, initialPage]);

  // Validate URL on mount and when it changes
  useEffect(() => {
    if (!isValidUrl(sourceUrl)) {
      setError('Invalid PDF URL provided.');
      setLoading(false);
    }
  }, [sourceUrl, isValidUrl]);

  if (!isValidUrl(sourceUrl)) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ height }}>
        <div className="text-center p-6">
          <p className="text-gray-600 mb-2">Invalid PDF URL</p>
          <p className="text-sm text-gray-500">Please provide a valid URL or file path.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ height }}>
        <div className="text-center p-6">
          <p className="text-gray-600 mb-2">Error Loading PDF</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <Button 
            onClick={() => {
              setError(null);
              setLoading(true);
            }}
            variant="outline"
            size="sm"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`} style={{ height }}>
      {/* Custom Controls */}
      {showControls && (
        <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={currentPage <= 1 || loading}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={jumpToPage}
                onChange={(e) => setJumpToPage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && jumpToSpecificPage()}
                onBlur={jumpToSpecificPage}
                className="w-16 h-8 text-center text-sm"
                min={1}
                max={totalPages}
                aria-label="Page number"
              />
              <span className="text-sm text-gray-600">
                of {totalPages || '?'}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage >= totalPages || loading}
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              disabled={scale <= 0.25}
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>

            <Select value={scale.toString()} onValueChange={handleZoomChange}>
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5">50%</SelectItem>
                <SelectItem value="0.75">75%</SelectItem>
                <SelectItem value="1">100%</SelectItem>
                <SelectItem value="1.25">125%</SelectItem>
                <SelectItem value="1.5">150%</SelectItem>
                <SelectItem value="2">200%</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={zoomIn}
              disabled={scale >= 3.0}
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading PDF...</p>
            </div>
          </div>
        )}
        
        <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
          <div style={{ height: showControls ? 'calc(100% - 60px)' : '100%' }}>
            <Viewer
              fileUrl={sourceUrl}
              plugins={[defaultLayoutPluginInstance]}
              onDocumentLoad={handleDocumentLoad}
              onPageChange={handlePageChange}
              onDocumentLoadError={handleLoadError}
              defaultScale={scale}
              ref={viewerRef}
            />
          </div>
        </Worker>
      </div>
    </div>
  );
}
