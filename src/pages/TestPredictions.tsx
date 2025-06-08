import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMaterials } from '@/hooks/useMaterials';
import { AlertCircle, FileText, Brain, Eye, EyeOff } from 'lucide-react';

export default function TestPredictions() {
  const { user } = useAuth();
  const { materials } = useMaterials();
  const [testResults, setTestResults] = useState<any>(null);
  const [extractedContent, setExtractedContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFullContent, setShowFullContent] = useState<{[key: string]: boolean}>({});

  const extractTextFromFile = async (filePath: string, fileType: string, materialName: string) => {
    try {
      console.log(`Extracting text from: ${materialName} (${fileType})`);
      
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('cramintel-materials')
        .download(filePath);

      if (downloadError || !fileData) {
        console.error('Failed to download file:', downloadError);
        return {
          materialName,
          error: `Failed to download: ${downloadError?.message || 'Unknown error'}`,
          content: '',
          contentLength: 0
        };
      }

      let textContent = '';
      
      if (fileType?.includes('text') || fileType?.includes('plain')) {
        textContent = await fileData.text();
      } else if (fileType?.includes('pdf')) {
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

      return {
        materialName,
        fileType,
        content: textContent,
        contentLength: textContent.length,
        error: null
      };

    } catch (error) {
      console.error('Error extracting text:', error);
      return {
        materialName,
        error: error.message,
        content: '',
        contentLength: 0
      };
    }
  };

  const runPredictionTest = async () => {
    if (!user || materials.length === 0) return;

    setLoading(true);
    setTestResults(null);
    setExtractedContent([]);

    try {
      console.log('Starting comprehensive prediction test...');
      
      // Extract content from all materials first
      const contentExtractionPromises = materials.slice(0, 5).map(async (material) => {
        if (material.file_path) {
          return await extractTextFromFile(material.file_path, material.file_type, material.name);
        }
        return {
          materialName: material.name,
          error: 'No file path available',
          content: '',
          contentLength: 0
        };
      });

      const extractedResults = await Promise.all(contentExtractionPromises);
      setExtractedContent(extractedResults);

      // Prepare test data
      const testClues = materials.slice(0, 2).map(material => ({
        id: material.id,
        name: material.name,
        type: 'past-questions' as const,
        materialId: material.id
      }));

      const testContext = {
        course: 'cedr 341',
        topics: ['entrepreneurship', 'business planning'],
        lecturer: 'Test Lecturer'
      };

      console.log('Test clues:', testClues);
      console.log('Test context:', testContext);

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('generate-predictions', {
        body: {
          clues: testClues,
          context: testContext,
          style: 'bullet'
        }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        throw error;
      }

      setTestResults({
        success: true,
        data: data,
        materials: materials.slice(0, 2),
        clues: testClues,
        context: testContext
      });

    } catch (error) {
      console.error('Test failed:', error);
      setTestResults({
        success: false,
        error: error.message || 'Unknown error',
        materials: materials.slice(0, 2)
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleContentVisibility = (materialName: string) => {
    setShowFullContent(prev => ({
      ...prev,
      [materialName]: !prev[materialName]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Comprehensive Prediction System Test</h1>
          <p className="text-gray-600">Deep debug page to see exactly what's happening during prediction generation</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Available Materials */}
          <Card>
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
                <div className="space-y-2">
                  {materials.slice(0, 5).map((material) => (
                    <div key={material.id} className="p-3 bg-gray-50 rounded border">
                      <div className="font-medium">{material.name}</div>
                      <div className="text-sm text-gray-600">
                        Course: {material.course} | Type: {material.material_type}
                      </div>
                      <div className="text-sm text-gray-600">
                        File: {material.file_type} | Size: {material.file_size ? `${Math.round(material.file_size / 1024)}KB` : 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {material.id}
                      </div>
                    </div>
                  ))}
                  {materials.length > 5 && (
                    <p className="text-sm text-gray-500">...and {materials.length - 5} more</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Test Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    This will extract ALL content from your materials and test the prediction system with CEDR 341 (entrepreneurship course).
                  </p>
                </div>
                
                <Button 
                  onClick={runPredictionTest}
                  disabled={loading || materials.length === 0 || !user}
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white"
                >
                  {loading ? 'Running Comprehensive Test...' : 'Run Full Content Test'}
                </Button>

                {!user && (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">Please log in to run tests</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Extracted Content Section */}
        {extractedContent.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📄 Extracted Content Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {extractedContent.map((content, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{content.materialName}</h3>
                        <div className="text-sm text-gray-600">
                          Type: {content.fileType || 'Unknown'} | 
                          Length: {content.contentLength.toLocaleString()} characters
                        </div>
                      </div>
                      <Button
                        onClick={() => toggleContentVisibility(content.materialName)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        {showFullContent[content.materialName] ? (
                          <>
                            <EyeOff className="w-4 h-4" />
                            Hide Content
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            Show Content
                          </>
                        )}
                      </Button>
                    </div>

                    {content.error ? (
                      <div className="bg-red-50 border border-red-200 p-3 rounded">
                        <p className="text-red-700">❌ Error: {content.error}</p>
                      </div>
                    ) : (
                      <div>
                        {content.contentLength === 0 ? (
                          <div className="bg-amber-50 border border-amber-200 p-3 rounded">
                            <p className="text-amber-700">⚠️ No content extracted</p>
                          </div>
                        ) : (
                          <div className="bg-green-50 border border-green-200 p-3 rounded">
                            <p className="text-green-700 mb-2">✅ Content extracted successfully</p>
                            
                            {/* Content Preview */}
                            <div className="bg-white border p-3 rounded text-sm">
                              <div className="font-medium mb-2">Preview (first 500 characters):</div>
                              <div className="text-gray-600 font-mono text-xs bg-gray-50 p-2 rounded overflow-auto">
                                {content.content.substring(0, 500)}
                                {content.content.length > 500 && '...'}
                              </div>
                            </div>

                            {/* Full Content (when toggled) */}
                            {showFullContent[content.materialName] && (
                              <div className="mt-3 bg-white border p-3 rounded">
                                <div className="font-medium mb-2">Full Content:</div>
                                <div className="text-gray-700 text-sm font-mono bg-gray-50 p-3 rounded max-h-96 overflow-auto whitespace-pre-wrap">
                                  {content.content}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Results */}
        {testResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {testResults.success ? '✅' : '❌'} Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Input Data */}
                <div>
                  <h3 className="font-semibold mb-2">Input Data:</h3>
                  <div className="bg-gray-50 p-4 rounded border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-sm mb-1">Materials Used:</h4>
                        <ul className="text-sm text-gray-600">
                          {testResults.materials?.map((material: any) => (
                            <li key={material.id}>• {material.name} ({material.course})</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-1">Context:</h4>
                        <div className="text-sm text-gray-600">
                          <div>Course: {testResults.context?.course}</div>
                          <div>Topics: {testResults.context?.topics?.join(', ')}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error or Success */}
                {testResults.success ? (
                  <div>
                    <h3 className="font-semibold mb-2">Generated Predictions:</h3>
                    <div className="bg-green-50 border border-green-200 p-4 rounded">
                      <pre className="text-sm overflow-auto max-h-96">
                        {JSON.stringify(testResults.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold mb-2">Error Details:</h3>
                    <div className="bg-red-50 border border-red-200 p-4 rounded">
                      <p className="text-red-700">{testResults.error}</p>
                    </div>
                  </div>
                )}

                {/* Raw Response */}
                {testResults.data && (
                  <div>
                    <h3 className="font-semibold mb-2">Content Analysis Summary:</h3>
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                      {testResults.data.content_analysis && (
                        <div className="text-sm">
                          <div>Materials Processed: {testResults.data.content_analysis.materials_processed}</div>
                          <div>Total Content Length: {testResults.data.content_analysis.total_content_length} characters</div>
                          <div>Whispers Count: {testResults.data.content_analysis.whispers_count}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
