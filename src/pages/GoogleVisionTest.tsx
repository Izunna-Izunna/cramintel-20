
import React from 'react';
import PageLayout from '@/components/PageLayout';
import GoogleVisionExtractor from '@/components/extraction/GoogleVisionExtractor';

const GoogleVisionTest = () => {
  return (
    <PageLayout showContact={false}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Google Cloud Vision Text Extractor
            </h1>
            <p className="text-lg text-gray-600">
              Upload images or PDFs to extract text using Google Cloud Vision API with advanced document analysis.
            </p>
          </div>
          <GoogleVisionExtractor />
        </div>
      </div>
    </PageLayout>
  );
};

export default GoogleVisionTest;
