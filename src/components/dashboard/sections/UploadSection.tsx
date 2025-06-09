
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Image, BookOpen, Zap, Cloud, Database, CheckCircle } from 'lucide-react';

export function UploadSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 font-space mb-2">Upload Materials</h2>
        <p className="text-gray-600">Upload your study materials to get AI-powered insights and predictions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors">
          <CardContent className="p-8 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Drag & Drop Files</h3>
            <p className="text-gray-600 mb-4">Drop your files here or click to browse</p>
            <Button className="bg-gray-800 hover:bg-gray-700">
              Choose Files
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Enhanced AWS Textract Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-green-50 rounded border border-green-200">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800">PDF Documents</span>
                </div>
                <p className="text-sm text-green-700">
                  ✅ Node.js Lambda microservice with full AWS SDK support
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-green-600">
                  <Database className="w-3 h-3" />
                  <span>S3-based async processing • Auto cleanup</span>
                </div>
              </div>
              
              <div className="p-3 bg-green-50 rounded border border-green-200">
                <div className="flex items-center gap-3 mb-2">
                  <Image className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800">Images (JPG, PNG)</span>
                </div>
                <p className="text-sm text-green-700">
                  ✅ High-speed sync processing with confidence scoring
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-green-600">
                  <Zap className="w-3 h-3" />
                  <span>Instant processing • Production ready</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-purple-500" />
                <span>Text Files (TXT)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enhanced Processing Architecture</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Node.js Lambda Processing
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Full AWS SDK v3 compatibility</li>
                <li>• Reliable S3-based PDF processing</li>
                <li>• Auto-polling for async jobs</li>
                <li>• Production-grade error handling</li>
              </ul>
            </div>
            <div className="p-4 bg-blue-50 rounded">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" />
                Optimized Performance
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Fast sync processing for images</li>
                <li>• Async processing for large PDFs</li>
                <li>• Automatic resource cleanup</li>
                <li>• High confidence text extraction</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Uploads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No files uploaded yet. Start by uploading your first study material!
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
