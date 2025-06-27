
import React from 'react';
import PageLayout from '@/components/PageLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PdfTextExtractor from '@/components/extraction/PdfTextExtractor';
import ImageTextExtractor from '@/components/extraction/ImageTextExtractor';
import PdfToImageExtractor from '@/components/extraction/PdfToImageExtractor';
import { FileText, Image, Layers } from 'lucide-react';

const TextExtractionTest = () => {
  return (
    <PageLayout showContact={false}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Text Extraction Testing Platform
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Test and compare three different text extraction methods to find the best approach for your documents.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="text-center">
                <FileText className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                <CardTitle className="text-lg">Direct PDF Text</CardTitle>
                <CardDescription>
                  Extracts native text content from PDFs using PDF.js
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant="secondary" className="w-full justify-center">
                    Best for: Text-based PDFs
                  </Badge>
                  <Badge variant="outline" className="w-full justify-center">
                    Speed: Fast
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Image className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <CardTitle className="text-lg">Image OCR</CardTitle>
                <CardDescription>
                  Direct OCR processing of images using Tesseract.js
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant="secondary" className="w-full justify-center">
                    Best for: Image files
                  </Badge>
                  <Badge variant="outline" className="w-full justify-center">
                    Speed: Medium
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Layers className="w-12 h-12 text-purple-600 mx-auto mb-2" />
                <CardTitle className="text-lg">PDF to Image OCR</CardTitle>
                <CardDescription>
                  Renders PDF pages as images, then applies OCR
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant="secondary" className="w-full justify-center">
                    Best for: Scanned PDFs
                  </Badge>
                  <Badge variant="outline" className="w-full justify-center">
                    Speed: Slow
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="pdf-direct" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pdf-direct" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Direct PDF
              </TabsTrigger>
              <TabsTrigger value="image-ocr" className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                Image OCR
              </TabsTrigger>
              <TabsTrigger value="pdf-to-image" className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                PDF to Image
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pdf-direct" className="mt-6">
              <PdfTextExtractor />
            </TabsContent>

            <TabsContent value="image-ocr" className="mt-6">
              <ImageTextExtractor />
            </TabsContent>

            <TabsContent value="pdf-to-image" className="mt-6">
              <PdfToImageExtractor />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageLayout>
  );
};

export default TextExtractionTest;
