
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import InteractiveImage from '@/components/InteractiveImage';

interface EnhancedImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  sourceUrl: string;
  fileName: string;
}

export function EnhancedImageViewer({ 
  isOpen, 
  onClose, 
  sourceUrl, 
  fileName
}: EnhancedImageViewerProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[95vh] p-0 gap-0">
        <div className="relative w-full h-full">
          {/* Close button overlay */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white/90 shadow-md"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>

          {/* Image viewer takes full space */}
          <div className="w-full h-full p-4">
            <InteractiveImage
              src={sourceUrl}
              alt={fileName}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
