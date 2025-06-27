
import React from 'react';
import { AccessibleDialog } from './AccessibleDialog';

interface EnhancedPdfViewerProps {
  isOpen: boolean;
  onClose: () => void;
  sourceUrl: string;
  fileName: string;
}

export function EnhancedPdfViewer({ isOpen, onClose, sourceUrl, fileName }: EnhancedPdfViewerProps) {
  return (
    <AccessibleDialog 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`PDF Viewer - ${fileName}`}
    >
      <div className="w-full h-full flex flex-col">
        <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden">
          <iframe
            src={sourceUrl}
            className="w-full h-[70vh]"
            title={`PDF: ${fileName}`}
          />
        </div>
      </div>
    </AccessibleDialog>
  );
}
