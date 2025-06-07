
import React, { useState, useCallback } from 'react';
import {
  RPConfig,
  RPProvider,
  RPTheme,
  RPDefaultLayout,
  RPPages,
} from '@pdf-viewer/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnhancedPdfViewerProps {
  isOpen: boolean;
  onClose: () => void;
  sourceUrl: string;
  fileName: string;
  initialPage?: number;
  showControls?: boolean;
}

export function EnhancedPdfViewer({ 
  isOpen, 
  onClose, 
  sourceUrl, 
  fileName, 
  initialPage = 1,
  showControls = true 
}: EnhancedPdfViewerProps) {
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(100);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  const zoomLevels = [50, 75, 100, 125, 150, 200];

  const handleDocumentLoad = useCallback((data: any) => {
    if (data?.numPages) {
      setTotalPages(data.numPages);
      setLoading(false);
    }
  }, []);

  const handleDocumentError = useCallback((error: any) => {
    console.error('PDF loading error:', error);
    setLoading(false);
    toast({
      title: "Error Loading PDF",
      description: "Unable to load the PDF file. Please try again.",
      variant: "destructive"
    });
  }, [toast]);

  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const zoomIn = () => {
    const currentIndex = zoomLevels.indexOf(zoom);
    if (currentIndex < zoomLevels.length - 1) {
      setZoom(zoomLevels[currentIndex + 1]);
    }
  };

  const zoomOut = () => {
    const currentIndex = zoomLevels.indexOf(zoom);
    if (currentIndex > 0) {
      setZoom(zoomLevels[currentIndex - 1]);
    }
  };

  const downloadFile = () => {
    const link = document.createElement('a');
    link.href = sourceUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (event.key) {
      case 'ArrowLeft':
        goToPrevPage();
        break;
      case 'ArrowRight':
        goToNextPage();
        break;
      case '+':
      case '=':
        zoomIn();
        break;
      case '-':
        zoomOut();
        break;
      case 'Escape':
        onClose();
        break;
    }
  }, [isOpen, currentPage, totalPages, zoom]);

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

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

        {showControls && (
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToPrevPage} 
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToNextPage} 
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={zoomOut} 
                disabled={zoom <= zoomLevels[0]}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600 min-w-[60px] text-center">
                {zoom}%
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={zoomIn} 
                disabled={zoom >= zoomLevels[zoomLevels.length - 1]}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto bg-gray-100 flex justify-center p-4">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
            </div>
          )}
          
          <RPConfig>
            <RPProvider>
              <RPTheme>
                <RPDefaultLayout>
                  <RPPages 
                    fileUrl={sourceUrl}
                    initialPage={currentPage}
                    scale={zoom / 100}
                    onDocumentLoad={handleDocumentLoad}
                    onDocumentError={handleDocumentError}
                  />
                </RPDefaultLayout>
              </RPTheme>
            </RPProvider>
          </RPConfig>
        </div>
      </DialogContent>
    </Dialog>
  );
}
