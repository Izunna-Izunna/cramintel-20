
import React from 'react';
import PageLayout from '@/components/PageLayout';
import GoogleVisionApiTest from '@/components/GoogleVisionApiTest';

const GoogleVisionApiTestPage = () => {
  return (
    <PageLayout showContact={false}>
      <div className="container mx-auto px-4 py-8">
        <GoogleVisionApiTest />
      </div>
    </PageLayout>
  );
};

export default GoogleVisionApiTestPage;
