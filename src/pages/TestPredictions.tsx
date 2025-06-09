import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMaterials } from '@/hooks/useMaterials';
import { FileText, Brain, Eye, EyeOff, Download, Search, Zap, CheckCircle, XCircle, AlertTriangle, Clock, FileX } from 'lucide-react';

export default function TestPredictions() {
  const { user } = useAuth();
  const { materials } = useMaterials();
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [extractedContent, setExtractedContent] = useState<any>(null);
  const [predictions, setPredictions] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [detailedError, setDetailedError] = useState<any>(null);

  const extractTextFromFile = async (material: any) => {
    try {
      console.log(`Starting text extraction for: ${material.name} (${material.file_type})`);
      setDetailedError(null);
      
      const { data: visionData, error: visionError } = await supabase.functions.invoke('google-vision-service', {
        body: {
          filePath: material.file_path,
          fileType: material.file_type
        }
      });

      if (visionError) {
        console.error('Google Vision service error:', visionError);
        setDetailedError({
          type: 'SUPABASE_ERROR',
          message: visionError.message || 'Unknown Supabase error',
          context: visionError.context || 'Supabase function invocation failed'
        });
        throw new Error(`Google Vision service failed: ${visionError.message || 'Unknown error'}`);
      }

      // Ensure visionData is properly parsed and not a Response object
      let parsedVisionData = visionData;
      if (visionData instanceof Response) {
        console.error('Received Response object instead of parsed data');
        parsedVisionData = await visionData.json();
      }

      // Check if the response contains detailed error information
      if (parsedVisionData && parsedVisionData.errorCode && !parsedVisionData.success) {
        console.error('Detailed Vision service error:', parsedVisionData);
        setDetailedError({
          type: 'VISION_API_ERROR',
          ...parsedVisionData
        });
        throw new Error(`${parsedVisionData.error || 'Vision API error'}: ${parsedVisionData.details || 'No details available'}`);
      }

      if (!parsedVisionData || !parsedVisionData.success) {
        console.error('Google Vision service returned unsuccessful response:', parsedVisionData);
        setDetailedError({
          type: 'VISION_RESPONSE_ERROR',
          message: 'Google Vision service returned unsuccessful response',
          data: parsedVisionData
        });
        throw new Error('Google Vision service returned unsuccessful response');
      }

      if (!parsedVisionData.text || parsedVisionData.text.length === 0) {
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
          extractionMethod: parsedVisionData.method || 'unknown',
          extractionConfidence: parsedVisionData.confidence || 0,
          error: 'No text could be extracted from this file',
          extractionTimestamp: new Date().toISOString(),
          isContentValid: false,
          processingUsed: true,
          processingTime: parsedVisionData.processingTime || 0,
          debugInfo: parsedVisionData.debugInfo || {}
        };
      }

      const wordCount = parsedVisionData.text.split(/\s+/).filter(word => word.length > 0).length;
      
      console.log(`Extraction successful: ${parsedVisionData.method}, confidence: ${parsedVisionData.confidence}%`);
      
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
        content: parsedVisionData.text,
        contentLength: parsedVisionData.text.length,
        wordCount: wordCount,
        characterCount: parsedVisionData.text.length,
        extractionMethod: parsedVisionData.method || 'unknown',
        extractionConfidence: parsedVisionData.confidence || 0,
        error: null,
        extractionTimestamp: new Date().toISOString(),
        isContentValid: parsedVisionData.text.length >= 50,
        processingUsed: true,
        boundingBoxes: parsedVisionData.boundingBoxes || [],
        metadata: parsedVisionData.metadata || {},
        processingTime: parsedVisionData.processingTime || 0,
        debugInfo: parsedVisionData.debugInfo || {}
      };

    } catch (error) {
      console.error('Text extraction failed:', error);
      return {
        materialName: material.name,
        materialId: material.id,
        error: error.message || 'Unknown extraction error',
        content: '',
        contentLength: 0,
        wordCount: 0,
        characterCount: 0,
        fileSize: material.file_size,
        fileType: material.file_type,
        extractionMethod: 'failed',
        extractionConfidence: 0,
        processingUsed: false,
        isContentValid: false,
        extractionTimestamp: new Date().toISOString(),
        debugInfo: {}
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
    setDetailedError(null);

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

  const getErrorIcon = (errorType: string) => {
    switch (errorType) {
      case 'SUPABASE_ERROR':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'VISION_API_ERROR':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'VISION_RESPONSE_ERROR':
        return <FileX className="w-5 h-5 text-red-600" />;
      default:
        return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  // Safe render helper for complex objects
  const safeRenderObject = (obj: any, fallback: string = 'N/A') => {
    if (!obj || typeof obj !== 'object') return fallback;
    try {
      return JSON.stringify(obj, null, 2);
    } catch (error) {
      return fallback;
    }
  };

  // Safe render helper for simple values
  const safeRenderValue = (value: any, fallback: string = 'N/A') => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'object') return safeRenderObject(value, fallback);
    return String(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Material Testing & Prediction Engine</h1>
          <p className="text-gray-600">Test material processing and generate intelligent exam predictions</p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-800 text-sm">
              <strong>🔍 Enhanced Debugging:</strong> Now with comprehensive error logging, detailed processing information, and improved PDF extraction!
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
                          ✓ {material.extraction_method} ({material.extraction_confidence || 0}%)
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
                  Enhanced Text Extraction Testing
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedMaterial ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded border">
                      <h3 className="font-semibold text-blue-800 mb-2">Selected Material:</h3>
                      <div className="text-sm text-blue-700">
                        <div><strong>Name:</strong> {safeRenderValue(selectedMaterial.name)}</div>
                        <div><strong>Course:</strong> {safeRenderValue(selectedMaterial.course)}</div>
                        <div><strong>Type:</strong> {safeRenderValue(selectedMaterial.material_type)}</div>
                        <div><strong>File:</strong> {safeRenderValue(selectedMaterial.file_type)}</div>
                        {selectedMaterial.extraction_method && (
                          <div className="mt-2 p-2 bg-green-100 rounded">
                            <div><strong>Previous Extraction:</strong> {safeRenderValue(selectedMaterial.extraction_method)}</div>
                            <div><strong>Confidence:</strong> {safeRenderValue(selectedMaterial.extraction_confidence, '0')}%</div>
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
                    <p className="text-gray-500">Select a material from the list to test enhanced text extraction</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detailed Error Display */}
            {detailedError && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    {getErrorIcon(detailedError.type)}
                    Detailed Error Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 p-4 bg-red-50 rounded">
                      <div>
                        <div className="text-sm font-medium text-red-600">Error Type</div>
                        <div className="text-red-800">{safeRenderValue(detailedError.type)}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-red-600">Error Code</div>
                        <div className="text-red-800">{safeRenderValue(detailedError.errorCode)}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-red-600">Timestamp</div>
                        <div className="text-red-800">{safeRenderValue(detailedError.timestamp, new Date().toISOString())}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-red-600">Context</div>
                        <div className="text-red-800">{safeRenderValue(detailedError.context, 'General error')}</div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-red-600 mb-2">Error Message:</div>
                      <div className="p-3 bg-red-100 rounded text-red-800 text-sm">
                        {safeRenderValue(detailedError.message || detailedError.error)}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-red-600 mb-2">Details:</div>
                      <div className="p-3 bg-red-100 rounded text-red-800 text-sm">
                        {safeRenderValue(detailedError.details, 'No additional details available')}
                      </div>
                    </div>

                    {detailedError.debugInfo && (
                      <div>
                        <div className="text-sm font-medium text-red-600 mb-2">Debug Information:</div>
                        <div className="p-3 bg-gray-100 rounded text-gray-800 text-xs font-mono">
                          <pre>{safeRenderObject(detailedError.debugInfo, 'No debug info available')}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Analysis Results */}
            {extractedContent && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      Enhanced Text Extraction Results
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
                    {/* Processing Performance Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded">
                      <div>
                        <div className="text-sm font-medium text-gray-600">Extraction Method</div>
                        <div className="text-lg font-semibold flex items-center gap-2">
                          {extractedContent.processingUsed ? (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              {safeRenderValue(extractedContent.extractionMethod)}
                            </>
                          ) : (
                            <>
                              <XCircle className="w-5 h-5 text-orange-600" />
                              {safeRenderValue(extractedContent.extractionMethod, 'Failed')}
                            </>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600">Confidence</div>
                        <div className={`text-lg font-semibold ${
                          (extractedContent.extractionConfidence || 0) >= 90 ? 'text-green-600' :
                          (extractedContent.extractionConfidence || 0) >= 70 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {safeRenderValue(extractedContent.extractionConfidence, '0')}%
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600">Word Count</div>
                        <div className="text-lg font-semibold">
                          {extractedContent.wordCount ? extractedContent.wordCount.toLocaleString() : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Processing Time
                        </div>
                        <div className="text-lg font-semibold text-blue-600">
                          {extractedContent.processingTime ? `${extractedContent.processingTime}ms` : 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Debug Information */}
                    {extractedContent.debugInfo && Object.keys(extractedContent.debugInfo).length > 0 && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                        <h3 className="font-semibold text-blue-800 mb-2">Debug Information:</h3>
                        <div className="text-sm text-blue-700 space-y-1">
                          {extractedContent.debugInfo.apiTime && (
                            <div><strong>API Response Time:</strong> {safeRenderValue(extractedContent.debugInfo.apiTime)}ms</div>
                          )}
                          {extractedContent.debugInfo.method && (
                            <div><strong>Detection Method:</strong> {safeRenderValue(extractedContent.debugInfo.method)}</div>
                          )}
                          {extractedContent.debugInfo.blockCount && (
                            <div><strong>Text Blocks Detected:</strong> {safeRenderValue(extractedContent.debugInfo.blockCount)}</div>
                          )}
                          <div className="mt-2">
                            <strong>Full Debug Data:</strong>
                            <pre className="text-xs mt-1 p-2 bg-white rounded overflow-x-auto">
                              {safeRenderObject(extractedContent.debugInfo)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Error Display */}
                    {extractedContent.error ? (
                      <div className="bg-red-50 border border-red-200 p-4 rounded">
                        <p className="text-red-700">❌ Extraction Error: {safeRenderValue(extractedContent.error)}</p>
                        <p className="text-red-600 text-sm mt-2">
                          This indicates an issue with the text extraction process. Check the detailed error information above for more specific debugging details.
                        </p>
                      </div>
                    ) : (
                      <div>
                        {(extractedContent.contentLength || 0) === 0 ? (
                          <div className="bg-amber-50 border border-amber-200 p-4 rounded">
                            <p className="text-amber-700">⚠️ No content extracted</p>
                            <p className="text-amber-600 text-sm mt-2">
                              Processing completed but no text was detected. This could be a valid result for image-based files.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 p-4 rounded">
                              <p className="text-green-700 mb-2">
                                ✅ Enhanced text extraction successful!
                              </p>
                              <div className="text-sm text-green-600">
                                Extracted: {(extractedContent.contentLength || 0).toLocaleString()} characters | 
                                {(extractedContent.wordCount || 0).toLocaleString()} words | 
                                Confidence: {safeRenderValue(extractedContent.extractionConfidence, '0')}%
                                {extractedContent.processingTime && ` | Processing: ${extractedContent.processingTime}ms`}
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
                                {extractedContent.content ? (
                                  showFullContent 
                                    ? extractedContent.content 
                                    : extractedContent.content.substring(0, 2000) + (extractedContent.content.length > 2000 ? '\n\n... (content truncated - click "Show Full Content" to see all)' : '')
                                ) : 'No content available'}
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
                        <p className="text-red-700">❌ Prediction Error: {safeRenderValue(predictions.error)}</p>
                      </div>
                    ) : (
                      <div>
                        {/* Prediction Summary */}
                        {predictions.prediction && (
                          <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-6">
                            <h3 className="font-semibold text-blue-800 mb-2">Prediction Summary:</h3>
                            <div className="text-sm text-blue-700 grid grid-cols-2 gap-4">
                              <div><strong>Confidence Score:</strong> {safeRenderValue(predictions.prediction.confidence_score, '0')}%</div>
                              <div><strong>Course:</strong> {safeRenderValue(predictions.prediction.course)}</div>
                              <div><strong>Generated:</strong> {predictions.prediction.generated_at ? new Date(predictions.prediction.generated_at).toLocaleString() : 'N/A'}</div>
                              <div><strong>Status:</strong> {safeRenderValue(predictions.prediction.status)}</div>
                            </div>
                          </div>
                        )}

                        {/* Content Analysis Info */}
                        {predictions.content_analysis && (
                          <div className="bg-green-50 border border-green-200 p-4 rounded mb-6">
                            <h3 className="font-semibold text-green-800 mb-2">Content Analysis:</h3>
                            <div className="text-sm text-green-700">
                              <div><strong>Materials Processed:</strong> {safeRenderValue(predictions.content_analysis.materials_processed, '0')}</div>
                              <div><strong>Total Content Length:</strong> {predictions.content_analysis.total_content_length ? predictions.content_analysis.total_content_length.toLocaleString() : 'N/A'} characters</div>
                              <div><strong>Whispers Count:</strong> {safeRenderValue(predictions.content_analysis.whispers_count, '0')}</div>
                            </div>
                          </div>
                        )}

                        {/* Generated Predictions */}
                        {predictions.generated_content?.predictions && Array.isArray(predictions.generated_content.predictions) && (
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
                                          (prediction.confidence || 0) >= 85 ? 'bg-green-100 text-green-700' :
                                          (prediction.confidence || 0) >= 70 ? 'bg-yellow-100 text-yellow-700' :
                                          'bg-red-100 text-red-700'
                                        }`}>
                                          {safeRenderValue(prediction.confidence, '0')}% confidence
                                        </span>
                                      )}
                                      {prediction.type && (
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                          {safeRenderValue(prediction.type)}
                                        </span>
                                      )}
                                      {prediction.difficulty && (
                                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                          {safeRenderValue(prediction.difficulty)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="mb-3">
                                    <div className="font-medium text-gray-800 mb-2">Question:</div>
                                    <div className="text-gray-700 bg-gray-50 p-3 rounded">
                                      {safeRenderValue(prediction.question, 'No question available')}
                                    </div>
                                  </div>

                                  {prediction.reasoning && (
                                    <div className="mb-3">
                                      <div className="text-sm font-medium text-gray-600 mb-1">Reasoning:</div>
                                      <div className="text-sm text-gray-600">
                                        {safeRenderValue(prediction.reasoning)}
                                      </div>
                                    </div>
                                  )}

                                  {prediction.sources && Array.isArray(prediction.sources) && prediction.sources.length > 0 && (
                                    <div>
                                      <div className="text-sm font-medium text-gray-600 mb-1">Sources:</div>
                                      <div className="flex flex-wrap gap-1">
                                        {prediction.sources.map((source, srcIndex) => (
                                          <span key={srcIndex} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                                            {safeRenderValue(source)}
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
                              <div><strong>Overall Confidence:</strong> {safeRenderValue(predictions.generated_content.overall_confidence, '0')}%</div>
                              {predictions.generated_content.analysis_summary && (
                                <div className="mt-2"><strong>Summary:</strong> {safeRenderValue(predictions.generated_content.analysis_summary)}</div>
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
