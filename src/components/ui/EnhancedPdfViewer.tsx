
import React from 'react';
import {
  RPConfig,
  RPProvider,
  RPTheme,
  RPDefaultLayout,
  RPPages,
} from '@pdf-viewer/react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface EnhancedPdfViewerProps {
  isOpen: boolean;
  onClose: () => void;
  sourceUrl: string;
  fileName: string;
}

export function EnhancedPdfViewer({ 
  isOpen, 
  onClose, 
  sourceUrl, 
  fileName
}: EnhancedPdfViewerProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[95vh] p-0 gap-0">
        <div className="relative w-full h-full">
          {/* Simple close button overlay */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white/90 shadow-md"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>

          {/* PDF Viewer takes full space */}
          <div className="w-full h-full">
            <RPConfig>
              <RPProvider src={sourceUrl}>
                <RPTheme>
                  <RPDefaultLayout>
                    <RPPages />
                  </RPDefaultLayout>
                </RPTheme>
              </RPProvider>
            </RPConfig>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
