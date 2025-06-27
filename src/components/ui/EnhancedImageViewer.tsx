
import React from 'react';
import { AccessibleDialog } from './AccessibleDialog';

interface EnhancedImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  sourceUrl: string;
  fileName: string;
}

export function EnhancedImageViewer({ isOpen, onClose, sourceUrl, fileName }: EnhancedImageViewerProps) {
  return (
    <AccessibleDialog 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Image Viewer - ${fileName}`}
    >
      <div className="w-full h-full flex flex-col">
        <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          <img
            src={sourceUrl}
            alt={fileName}
            className="max-w-full max-h-[70vh] object-contain"
          />
        </div>
      </div>
    </AccessibleDialog>
  );
}
