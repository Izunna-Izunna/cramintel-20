
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PdfViewer } from '@/components/ui/pdf-viewer';
import { FileText, ExternalLink } from 'lucide-react';

export function EnhancedPdfViewer() {
  const [sourceUrl, setSourceUrl] = useState('https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf');
  const [initialPage, setInitialPage] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [viewerKey, setViewerKey] = useState(0);

  const handleLoadPdf = () => {
    // Force re-render of the PDF viewer with new props
    setViewerKey(prev => prev + 1);
  };

  const samplePdfs = [
    {
      name: 'Sample Research Paper',
      url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
    },
    {
      name: 'PDF.js Documentation',
      url: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 font-space mb-2">Enhanced PDF Viewer</h2>
        <p className="text-gray-600">Advanced PDF viewing with enhanced controls and functionality</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              PDF Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="pdf-url">PDF URL</Label>
              <Input
                id="pdf-url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="Enter PDF URL..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="initial-page">Initial Page</Label>
              <Input
                id="initial-page"
                type="number"
                min={1}
                value={initialPage}
                onChange={(e) => setInitialPage(parseInt(e.target.value) || 1)}
                className="mt-1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="show-controls"
                checked={showControls}
                onCheckedChange={setShowControls}
              />
              <Label htmlFor="show-controls">Show Controls</Label>
            </div>

            <Button onClick={handleLoadPdf} className="w-full">
              Load PDF
            </Button>

            <div className="pt-4 border-t">
              <Label className="text-sm font-medium">Sample PDFs</Label>
              <div className="mt-2 space-y-2">
                {samplePdfs.map((pdf, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSourceUrl(pdf.url);
                      setInitialPage(1);
                      setTimeout(handleLoadPdf, 100);
                    }}
                    className="w-full text-left p-2 text-sm rounded hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {pdf.name}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PDF Viewer */}
        <div className="lg:col-span-3">
          <Card className="h-[800px]">
            <CardContent className="p-0 h-full">
              <PdfViewer
                key={viewerKey}
                sourceUrl={sourceUrl}
                initialPage={initialPage}
                showControls={showControls}
                className="h-full"
                height="100%"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features Info */}
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Navigation</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Arrow keys for page navigation</li>
                <li>• Jump to specific page</li>
                <li>• Next/Previous buttons</li>
                <li>• Page counter display</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Zoom Controls</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Keyboard shortcuts (+/-)</li>
                <li>• Zoom dropdown (50%-200%)</li>
                <li>• Zoom in/out buttons</li>
                <li>• Responsive scaling</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Accessibility</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• ARIA labels for controls</li>
                <li>• Keyboard navigation</li>
                <li>• Screen reader support</li>
                <li>• Focus management</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
