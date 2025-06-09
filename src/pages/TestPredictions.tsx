
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMaterials } from '@/hooks/useMaterials';
import { FileText, Brain, Eye, EyeOff, Download, Search, Zap, CheckCircle, XCircle } from 'lucide-react';

export default function TestPredictions() {
  const { user } = useAuth();
  const { materials } = useMaterials();
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [extractedContent, setExtractedContent] = useState<any>(null);
  const [predictions, setPredictions] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  const extractTextFromFile = async (material: any) => {
    try {
      console.log(`Starting text extraction for: ${material.name} (${material.file_type})`);
      
      // Call Google Vision service directly to get the actual extracted text
      const { data: visionData, error: visionError } = await supabase.functions.invoke('google-vision-service', {
        body: {
          filePath: material.file_path,
          fileType: material.file_type
        }
      });

      if (visionError) {
        console.error('Google Vision service error:', visionError);
        throw new Error(`Google Vision service failed: ${visionError.message}`);
      }

      if (!visionData || !visionData.success) {
        console.error('Google Vision service returned unsuccessful response:', visionData);
        throw new Error('Google Vision service returned unsuccessful response');
      }

      if (!visionData.text || visionData.text.length === 0) {
        console.log('Google Vision extracted no text from the file');
        return {
          materialName: material.name,
          materialId: material.id,
          course: material.course,
          materialType: material.material_type,
          fileName: material.file_name,
          fileType: material.file_type,
          fileSize: material.file_size,
          uploadDate: material.upload_date,
          processed: true,
          content: '',
          contentLength: 0,
          wordCount: 0,
          characterCount: 0,
          extractionMethod: visionData.method,
          extractionConfidence: visionData.confidence,
          error: 'No text could be extracted from this file',
          extractionTimestamp: new Date().toISOString(),
          isContentValid: false,
          processingUsed: true
        };
      }

      // Calculate additional metrics
      const wordCount = visionData.text.split(/\s+/).filter(word => word.length > 0).length;
      
      console.log(`Extraction successful: ${visionData.method}, confidence: ${visionData.confidence}%`);
      
      return {
        materialName: material.name,
        materialId: material.id,
        course: material.course,
        materialType: material.material_type,
        fileName: material.file_name,
        fileType: material.file_type,
        fileSize: material.file_size,
        uploadDate: material.upload_date,
        processed: true,
        content: visionData.text,
        contentLength: visionData.text.length,
        wordCount: wordCount,
        characterCount: visionData.text.length,
        extractionMethod: visionData.method,
        extractionConfidence: visionData.confidence,
        error: null,
        extractionTimestamp: new Date().toISOString(),
        isContentValid: visionData.text.length >= 50, // Consider valid if at least 50 characters
        processingUsed: true,
        boundingBoxes: visionData.boundingBoxes,
        metadata: visionData.metadata
      };

    } catch (error) {
      console.error('Text extraction failed:', error);
      return {
        materialName: material.name,
        materialId: material.id,
        error: error.message,
        content: '',
        contentLength: 0,
        wordCount: 0,
        characterCount: 0,
        fileSize: material.file_size,
        fileType: material.file_type,
        extractionMethod: 'failed',
        extractionConfidence: 0,
        processingUsed: false,
        isContentValid: false
      };
    }
  };

  const analyzeMaterial = async (material: any) => {
    if (!material.file_path) {
      setExtractedContent({
        materialName: material.name,
        error: 'No file path available',
        content: '',
        contentLength: 0,
        isContentValid: false
      });
      return;
    }

    setLoading(true);
    setExtractedContent(null);
    setPredictions(null);
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
        contentLength: 0,
        isContentValid: false
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePredictions = async () => {
    if (!extractedContent || !extractedContent.content || extractedContent.error) {
      alert('Please process content first and ensure there are no errors');
      return;
    }

    setPredictionLoading(true);
    setPredictions(null);

    try {
      console.log('Generating predictions for material:', extractedContent.materialName);
      console.log('Using extraction method:', extractedContent.extractionMethod);
      console.log('Extraction confidence:', extractedContent.extractionConfidence);
      
      const { data, error } = await supabase.functions.invoke('generate-predictions', {
        body: {
          clues: [{
            id: extractedContent.materialId,
            type: 'material',
            materialId: extractedContent.materialId,
            content: extractedContent.content,
            materialType: extractedContent.materialType
          }],
          context: {
            course: extractedContent.course || 'General Course',
            examDate: null,
            materialType: extractedContent.materialType
          },
          style: 'predictions'
        }
      });

      if (error) {
        console.error('Error generating predictions:', error);
        setPredictions({
          error: `Failed to generate predictions: ${error.message}`,
          predictions: []
        });
        return;
      }

      console.log('Predictions generated successfully:', data);
      setPredictions(data);

    } catch (error) {
      console.error('Prediction generation failed:', error);
      setPredictions({
        error: error.message,
        predictions: []
      });
    } finally {
      setPredictionLoading(false);
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Material Testing & Prediction Engine</h1>
          <p className="text-gray-600">Test material processing and generate intelligent exam predictions</p>
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
            <p className="text-green-800 text-sm">
              <strong>✨ Enhanced:</strong> Now using advanced text extraction with full content display and confidence scoring!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Materials List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Test Materials ({materials.length})
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
                      {material.extraction_method && (
                        <div className="text-xs text-blue-600 mt-1">
                          ✓ {material.extraction_method} ({material.extraction_confidence}%)
                        </div>
                      )}
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
                  Live Text Extraction Testing
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
                        {selectedMaterial.extraction_method && (
                          <div className="mt-2 p-2 bg-green-100 rounded">
                            <div><strong>Previous Extraction:</strong> {selectedMaterial.extraction_method}</div>
                            <div><strong>Confidence:</strong> {selectedMaterial.extraction_confidence}%</div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => analyzeMaterial(selectedMaterial)}
                        disabled={loading}
                        className="flex-1"
                      >
                        {loading ? 'Extracting Text...' : 'Extract Full Text Content'}
                      </Button>
                      
                      {extractedContent && !extractedContent.error && extractedContent.isContentValid && (
                        <Button 
                          onClick={generatePredictions}
                          disabled={predictionLoading}
                          variant="outline"
                          className="flex-1 flex items-center gap-2"
                        >
                          <Zap className="w-4 h-4" />
                          {predictionLoading ? 'Generating...' : 'Generate Predictions'}
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Select a material from the list to test live text extraction</p>
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
                      Live Text Extraction Results
                    </span>
                    {extractedContent.content && (
                      <Button
                        onClick={downloadContent}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Extraction Method Status */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded">
                      <div>
                        <div className="text-sm font-medium text-gray-600">Extraction Method</div>
                        <div className="text-lg font-semibold flex items-center gap-2">
                          {extractedContent.processingUsed ? (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              {extractedContent.extractionMethod}
                            </>
                          ) : (
                            <>
                              <XCircle className="w-5 h-5 text-orange-600" />
                              {extractedContent.extractionMethod || 'Failed'}
                            </>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600">Confidence</div>
                        <div className={`text-lg font-semibold ${
                          extractedContent.extractionConfidence >= 90 ? 'text-green-600' :
                          extractedContent.extractionConfidence >= 70 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {extractedContent.extractionConfidence || 0}%
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600">Word Count</div>
                        <div className="text-lg font-semibold">
                          {extractedContent.wordCount?.toLocaleString() || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600">Quality</div>
                        <div className={`text-lg font-semibold ${extractedContent.isContentValid ? 'text-green-600' : 'text-red-600'}`}>
                          {extractedContent.isContentValid ? 'Excellent' : 'Poor'}
                        </div>
                      </div>
                    </div>

                    {/* Error Display */}
                    {extractedContent.error ? (
                      <div className="bg-red-50 border border-red-200 p-4 rounded">
                        <p className="text-red-700">❌ Extraction Error: {extractedContent.error}</p>
                        <p className="text-red-600 text-sm mt-2">
                          This could indicate an issue with the Google Vision service or file format compatibility.
                        </p>
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
                              <p className="text-green-700 mb-2">
                                ✅ Live text extraction successful!
                              </p>
                              <div className="text-sm text-green-600">
                                Extracted: {extractedContent.contentLength.toLocaleString()} characters | 
                                {extractedContent.wordCount.toLocaleString()} words | 
                                Confidence: {extractedContent.extractionConfidence}%
                              </div>
                            </div>

                            {/* Content Display Controls */}
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-lg">Extracted Text Content:</h3>
                              <Button
                                onClick={() => setShowFullContent(!showFullContent)}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                              >
                                {showFullContent ? (
                                  <>
                                    <EyeOff className="w-4 h-4" />
                                    Show Preview
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
                                {showFullContent ? 'Complete Extracted Text:' : 'Preview (first 2000 characters):'}
                              </div>
                              <div className="text-sm text-gray-800 font-mono bg-gray-50 p-4 rounded max-h-96 overflow-auto whitespace-pre-wrap border leading-relaxed">
                                {showFullContent 
                                  ? extractedContent.content 
                                  : extractedContent.content.substring(0, 2000) + (extractedContent.content.length > 2000 ? '\n\n... (content truncated - click "Show Full Content" to see all)' : '')
                                }
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Predictions Section */}
            {predictions && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    AI-Generated Exam Predictions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {predictions.error ? (
                      <div className="bg-red-50 border border-red-200 p-4 rounded">
                        <p className="text-red-700">❌ Prediction Error: {predictions.error}</p>
                      </div>
                    ) : (
                      <div>
                        {/* Prediction Summary */}
                        {predictions.prediction && (
                          <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-6">
                            <h3 className="font-semibold text-blue-800 mb-2">Prediction Summary:</h3>
                            <div className="text-sm text-blue-700 grid grid-cols-2 gap-4">
                              <div><strong>Confidence Score:</strong> {predictions.prediction.confidence_score}%</div>
                              <div><strong>Course:</strong> {predictions.prediction.course}</div>
                              <div><strong>Generated:</strong> {new Date(predictions.prediction.generated_at).toLocaleString()}</div>
                              <div><strong>Status:</strong> {predictions.prediction.status}</div>
                            </div>
                          </div>
                        )}

                        {/* Content Analysis Info */}
                        {predictions.content_analysis && (
                          <div className="bg-green-50 border border-green-200 p-4 rounded mb-6">
                            <h3 className="font-semibold text-green-800 mb-2">Content Analysis:</h3>
                            <div className="text-sm text-green-700">
                              <div><strong>Materials Processed:</strong> {predictions.content_analysis.materials_processed}</div>
                              <div><strong>Total Content Length:</strong> {predictions.content_analysis.total_content_length?.toLocaleString()} characters</div>
                              <div><strong>Whispers Count:</strong> {predictions.content_analysis.whispers_count}</div>
                            </div>
                          </div>
                        )}

                        {/* Generated Predictions */}
                        {predictions.generated_content?.predictions && (
                          <div>
                            <h3 className="font-semibold text-lg mb-4">Quality Exam Predictions ({predictions.generated_content.predictions.length}):</h3>
                            <div className="space-y-4">
                              {predictions.generated_content.predictions.slice(0, 10).map((prediction, index) => (
                                <div key={index} className="bg-white border rounded p-4 shadow-sm">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="text-sm font-medium text-gray-600">
                                      Question #{index + 1}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {prediction.confidence && (
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                          prediction.confidence >= 85 ? 'bg-green-100 text-green-700' :
                                          prediction.confidence >= 70 ? 'bg-yellow-100 text-yellow-700' :
                                          'bg-red-100 text-red-700'
                                        }`}>
                                          {prediction.confidence}% confidence
                                        </span>
                                      )}
                                      {prediction.type && (
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                          {prediction.type}
                                        </span>
                                      )}
                                      {prediction.difficulty && (
                                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                          {prediction.difficulty}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="mb-3">
                                    <div className="font-medium text-gray-800 mb-2">Question:</div>
                                    <div className="text-gray-700 bg-gray-50 p-3 rounded">
                                      {prediction.question}
                                    </div>
                                  </div>

                                  {prediction.reasoning && (
                                    <div className="mb-3">
                                      <div className="text-sm font-medium text-gray-600 mb-1">Reasoning:</div>
                                      <div className="text-sm text-gray-600">
                                        {prediction.reasoning}
                                      </div>
                                    </div>
                                  )}

                                  {prediction.sources && prediction.sources.length > 0 && (
                                    <div>
                                      <div className="text-sm font-medium text-gray-600 mb-1">Sources:</div>
                                      <div className="flex flex-wrap gap-1">
                                        {prediction.sources.map((source, srcIndex) => (
                                          <span key={srcIndex} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                                            {source}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>

                            {predictions.generated_content.predictions.length > 10 && (
                              <div className="mt-4 text-center text-gray-500">
                                Showing first 10 predictions out of {predictions.generated_content.predictions.length} total
                              </div>
                            )}
                          </div>
                        )}

                        {/* Overall Analysis */}
                        {predictions.generated_content?.overall_confidence && (
                          <div className="mt-6 bg-gray-50 border border-gray-200 p-4 rounded">
                            <h3 className="font-semibold text-gray-800 mb-2">Overall Analysis:</h3>
                            <div className="text-sm text-gray-700">
                              <div><strong>Overall Confidence:</strong> {predictions.generated_content.overall_confidence}%</div>
                              {predictions.generated_content.analysis_summary && (
                                <div className="mt-2"><strong>Summary:</strong> {predictions.generated_content.analysis_summary}</div>
                              )}
                            </div>
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
