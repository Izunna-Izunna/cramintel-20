
import React, { useState } from 'react';
import PageLayout from '@/components/PageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PdfTextExtractor from '@/components/extraction/PdfTextExtractor';
import ImageTextExtractor from '@/components/extraction/ImageTextExtractor';
import PdfToImageExtractor from '@/components/extraction/PdfToImageExtractor';

const TextExtractionTest = () => {
  const [activeTab, setActiveTab] = useState("pdf");

  return (
    <PageLayout showContact={false}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Text Extraction Testing Platform
            </h1>
            <p className="text-lg text-gray-600">
              Test three different text extraction methods to find the best approach for your documents.
            </p>
          </div>

          <div className="mb-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pdf">PDF Extractor</TabsTrigger>
                <TabsTrigger value="image">Image Extractor</TabsTrigger>
                <TabsTrigger value="pdf-to-image">PDF to Image Extractor</TabsTrigger>
              </TabsList>
              <TabsContent value="pdf">
                <PdfTextExtractor />
              </TabsContent>
              <TabsContent value="image">
                <ImageTextExtractor />
              </TabsContent>
              <TabsContent value="pdf-to-image">
                <PdfToImageExtractor />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default TextExtractionTest;
