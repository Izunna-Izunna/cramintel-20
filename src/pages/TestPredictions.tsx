
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMaterials } from '@/hooks/useMaterials';
import { AlertCircle, FileText, Brain, Eye, EyeOff, Download, Search } from 'lucide-react';

export default function TestPredictions() {
  const { user } = useAuth();
  const { materials } = useMaterials();
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [extractedContent, setExtractedContent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  const extractTextFromFile = async (material: any) => {
    try {
      console.log(`Extracting text from: ${material.name} (${material.file_type})`);
      
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('cramintel-materials')
        .download(material.file_path);

      if (downloadError || !fileData) {
        console.error('Failed to download file:', downloadError);
        return {
          materialName: material.name,
          error: `Failed to download: ${downloadError?.message || 'Unknown error'}`,
          content: '',
          contentLength: 0,
          fileSize: material.file_size,
          fileType: material.file_type
        };
      }

      let textContent = '';
      
      if (material.file_type?.includes('text') || material.file_type?.includes('plain')) {
        textContent = await fileData.text();
      } else if (material.file_type?.includes('pdf')) {
        // Try to read PDF as text (some PDFs have extractable text)
        try {
          textContent = await fileData.text();
          if (!textContent || textContent.length < 100) {
            textContent = 'PDF content extraction requires OCR - text layer not available or insufficient';
          }
        } catch (error) {
          textContent = 'PDF content extraction failed - binary format detected';
        }
      } else {
        // Try to read other file types as text
        try {
          textContent = await fileData.text();
          if (!textContent) {
            textContent = 'File content could not be extracted as text';
          }
        } catch (error) {
          textContent = `File reading failed: ${error.message}`;
        }
      }

      // Clean and analyze the content
      const cleanedContent = textContent
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s.,!?;:()\-\[\]]/g, '')
        .trim();

      // Extract key information
      const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
      const characterCount = textContent.length;
      const lineCount = textContent.split('\n').length;
      const paragraphCount = textContent.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;

      // Find potential course-related keywords
      const courseKeywords = [
        'entrepreneurship', 'business', 'startup', 'venture', 'innovation', 
        'business plan', 'market', 'revenue', 'profit', 'customer', 'strategy',
        'competition', 'funding', 'investment', 'pitch', 'marketing'
      ];
      
      const foundKeywords = courseKeywords.filter(keyword => 
        textContent.toLowerCase().includes(keyword.toLowerCase())
      );

      return {
        materialName: material.name,
        materialId: material.id,
        course: material.course,
        materialType: material.material_type,
        fileName: material.file_name,
        fileType: material.file_type,
        fileSize: material.file_size,
        uploadDate: material.upload_date,
        processed: material.processed,
        content: textContent,
        cleanedContent: cleanedContent,
        contentLength: textContent.length,
        cleanedContentLength: cleanedContent.length,
        wordCount: wordCount,
        characterCount: characterCount,
        lineCount: lineCount,
        paragraphCount: paragraphCount,
        foundKeywords: foundKeywords,
        error: null,
        extractionTimestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error extracting text:', error);
      return {
        materialName: material.name,
        error: error.message,
        content: '',
        contentLength: 0,
        fileSize: material.file_size,
        fileType: material.file_type
      };
    }
  };

  const analyzeMaterial = async (material: any) => {
    if (!material.file_path) {
      setExtractedContent({
        materialName: material.name,
        error: 'No file path available',
        content: '',
        contentLength: 0
      });
      return;
    }

    setLoading(true);
    setExtractedContent(null);
    setShowFullContent(false);

    try {
      const result = await extractTextFromFile(material);
      setExtractedContent(result);
    } catch (error) {
      console.error('Analysis failed:', error);
      setExtractedContent({
        materialName: material.name,
        error: error.message,
        content: '',
        contentLength: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadContent = () => {
    if (!extractedContent?.content) return;
    
    const blob = new Blob([extractedContent.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${extractedContent.materialName}_extracted_content.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Material Content Analyzer</h1>
          <p className="text-gray-600">Select a material to extract and analyze all its content in detail</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Materials List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Available Materials ({materials.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {materials.length === 0 ? (
                <p className="text-gray-500">No materials found. Upload some materials first.</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {materials.map((material) => (
                    <div 
                      key={material.id} 
                      className={`p-3 rounded border cursor-pointer transition-colors ${
                        selectedMaterial?.id === material.id 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={() => setSelectedMaterial(material)}
                    >
                      <div className="font-medium text-sm">{material.name}</div>
                      <div className="text-xs text-gray-600">
                        {material.course} | {material.material_type}
                      </div>
                      <div className="text-xs text-gray-500">
                        {material.file_type} | {material.file_size ? `${Math.round(material.file_size / 1024)}KB` : 'Size unknown'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis Controls and Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Control Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Analysis Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedMaterial ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded border">
                      <h3 className="font-semibold text-blue-800 mb-2">Selected Material:</h3>
                      <div className="text-sm text-blue-700">
                        <div><strong>Name:</strong> {selectedMaterial.name}</div>
                        <div><strong>Course:</strong> {selectedMaterial.course}</div>
                        <div><strong>Type:</strong> {selectedMaterial.material_type}</div>
                        <div><strong>File:</strong> {selectedMaterial.file_type}</div>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => analyzeMaterial(selectedMaterial)}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? 'Analyzing Content...' : 'Extract & Analyze All Content'}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Select a material from the list to analyze its content</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Analysis Results */}
            {extractedContent && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      Content Analysis Results
                    </span>
                    {extractedContent.content && (
                      <Button
                        onClick={downloadContent}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download Content
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Material Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded">
                      <div>
                        <div className="text-sm font-medium text-gray-600">File Size</div>
                        <div className="text-lg font-semibold">
                          {extractedContent.fileSize ? `${Math.round(extractedContent.fileSize / 1024)}KB` : 'Unknown'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600">Word Count</div>
                        <div className="text-lg font-semibold">
                          {extractedContent.wordCount?.toLocaleString() || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600">Characters</div>
                        <div className="text-lg font-semibold">
                          {extractedContent.characterCount?.toLocaleString() || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600">Lines</div>
                        <div className="text-lg font-semibold">
                          {extractedContent.lineCount?.toLocaleString() || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Course Keywords Found */}
                    {extractedContent.foundKeywords && extractedContent.foundKeywords.length > 0 && (
                      <div className="p-4 bg-green-50 rounded border border-green-200">
                        <h3 className="font-semibold text-green-800 mb-2">Course-Related Keywords Found:</h3>
                        <div className="flex flex-wrap gap-2">
                          {extractedContent.foundKeywords.map((keyword, index) => (
                            <span key={index} className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Error Display */}
                    {extractedContent.error ? (
                      <div className="bg-red-50 border border-red-200 p-4 rounded">
                        <p className="text-red-700">❌ Error: {extractedContent.error}</p>
                      </div>
                    ) : (
                      <div>
                        {extractedContent.contentLength === 0 ? (
                          <div className="bg-amber-50 border border-amber-200 p-4 rounded">
                            <p className="text-amber-700">⚠️ No content extracted</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 p-4 rounded">
                              <p className="text-green-700 mb-2">✅ Content extracted successfully</p>
                              <div className="text-sm text-green-600">
                                Original: {extractedContent.contentLength.toLocaleString()} characters | 
                                Cleaned: {extractedContent.cleanedContentLength?.toLocaleString() || 'N/A'} characters
                              </div>
                            </div>

                            {/* Content Display Controls */}
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-lg">Extracted Content:</h3>
                              <Button
                                onClick={() => setShowFullContent(!showFullContent)}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                              >
                                {showFullContent ? (
                                  <>
                                    <EyeOff className="w-4 h-4" />
                                    Show Preview Only
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-4 h-4" />
                                    Show Full Content
                                  </>
                                )}
                              </Button>
                            </div>

                            {/* Content Preview */}
                            <div className="bg-white border rounded p-4">
                              <div className="font-medium mb-2 text-gray-700">
                                {showFullContent ? 'Complete Content:' : 'Preview (first 1000 characters):'}
                              </div>
                              <div className="text-sm text-gray-800 font-mono bg-gray-50 p-4 rounded max-h-96 overflow-auto whitespace-pre-wrap border">
                                {showFullContent 
                                  ? extractedContent.content 
                                  : extractedContent.content.substring(0, 1000) + (extractedContent.content.length > 1000 ? '\n\n... (content truncated - click "Show Full Content" to see everything)' : '')
                                }
                              </div>
                            </div>

                            {/* Cleaned Content (if different) */}
                            {extractedContent.cleanedContent && extractedContent.cleanedContent !== extractedContent.content && (
                              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                                <div className="font-medium mb-2 text-blue-700">Cleaned Content (for AI processing):</div>
                                <div className="text-sm text-blue-800 font-mono bg-white p-3 rounded max-h-48 overflow-auto whitespace-pre-wrap">
                                  {extractedContent.cleanedContent.substring(0, 500)}
                                  {extractedContent.cleanedContent.length > 500 && '... (truncated)'}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
