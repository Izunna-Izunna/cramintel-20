
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PdfViewer } from '@/components/ui/PdfViewer';
import { FileText, ExternalLink } from 'lucide-react';

export function EnhancedPdfViewer() {
  const [pdfUrl, setPdfUrl] = useState('');
  const [showViewer, setShowViewer] = useState(false);
  const [initialPage, setInitialPage] = useState(1);
  const [showControls, setShowControls] = useState(true);

  // Sample PDF URLs for testing
  const samplePdfs = [
    {
      name: 'Sample PDF Document',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
    },
    {
      name: 'Lorem Ipsum PDF',
      url: 'https://www.learningcontainer.com/wp-content/uploads/2019/09/sample-pdf-file.pdf'
    }
  ];

  const handleLoadPdf = () => {
    if (pdfUrl.trim()) {
      setShowViewer(true);
    }
  };

  const handleSamplePdf = (url: string) => {
    setPdfUrl(url);
    setShowViewer(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Enhanced PDF Viewer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pdf-url">PDF URL</Label>
              <Input
                id="pdf-url"
                placeholder="Enter PDF URL..."
                value={pdfUrl}
                onChange={(e) => setPdfUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLoadPdf()}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="initial-page">Initial Page</Label>
              <Input
                id="initial-page"
                type="number"
                min="1"
                value={initialPage}
                onChange={(e) => setInitialPage(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="show-controls"
              checked={showControls}
              onChange={(e) => setShowControls(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="show-controls">Show Controls</Label>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleLoadPdf} disabled={!pdfUrl.trim()}>
              Load PDF
            </Button>
            
            {samplePdfs.map((sample, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSamplePdf(sample.url)}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                {sample.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {showViewer && pdfUrl && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>PDF Document</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowViewer(false)}
              >
                Close Viewer
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <PdfViewer
              sourceUrl={pdfUrl}
              initialPage={initialPage}
              showControls={showControls}
              height="70vh"
              className="border-t"
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Navigation</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Next/Previous page buttons</li>
                <li>• Jump to specific page</li>
                <li>• Keyboard shortcuts (← →)</li>
                <li>• Page counter display</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Viewing</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Zoom controls (+/-)</li>
                <li>• Multiple zoom levels</li>
                <li>• Responsive design</li>
                <li>• Error handling & retry</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Accessibility</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• ARIA labels</li>
                <li>• Keyboard navigation</li>
                <li>• Screen reader support</li>
                <li>• Focus management</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Performance</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Lazy loading</li>
                <li>• Memory optimization</li>
                <li>• Progress indicators</li>
                <li>• Error boundaries</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
