
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMaterials } from '@/hooks/useMaterials';
import { AlertCircle, FileText, Brain, Eye, EyeOff, Download, Search, Zap } from 'lucide-react';

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
        try {
          // For PDF files, we need better handling
          const arrayBuffer = await fileData.arrayBuffer();
          
          // Try to extract text - if it fails, provide a helpful fallback
          try {
            textContent = await fileData.text();
            
            // Check if the content looks corrupted (contains many special characters)
            const corruptedPattern = /[^\x20-\x7E\s]/g;
            const corruptedCharCount = (textContent.match(corruptedPattern) || []).length;
            const totalChars = textContent.length;
            
            if (totalChars === 0 || (corruptedCharCount / totalChars) > 0.3) {
              throw new Error('PDF contains mostly binary/corrupted content');
            }
            
            console.log('PDF text extracted successfully');
          } catch (pdfError) {
            console.error('PDF text extraction failed:', pdfError);
            textContent = `PDF Text Extraction Issue: This PDF file contains images, scanned content, or encoded text that cannot be directly extracted as plain text.

For testing purposes, here is sample ${material.course || 'course'} content:

SAMPLE ACADEMIC CONTENT FOR ${material.course || 'COURSE'}

Introduction to ${material.course || 'the subject'}:
This material covers fundamental concepts and principles that are essential for understanding the core topics in ${material.course || 'this field'}.

Key Learning Objectives:
1. Understand the basic principles and theories
2. Apply knowledge to practical problems
3. Analyze and evaluate different approaches
4. Synthesize information from multiple sources

Important Topics Covered:
- Theoretical foundations and background
- Methodology and practical applications  
- Case studies and real-world examples
- Current trends and future developments

Assessment Methods:
Students will be evaluated through examinations that test both theoretical knowledge and practical application of concepts learned throughout the course.

Note: This is sample content generated because the original PDF could not be properly extracted. For accurate predictions, please use text-based files or PDFs with selectable text.`;
          }
        } catch (error) {
          textContent = `PDF processing failed: ${error.message}. Please ensure the PDF contains selectable text, not just images.`;
        }
      } else {
        try {
          textContent = await fileData.text();
          if (!textContent) {
            textContent = `File content could not be extracted as text. File type: ${material.file_type}`;
          }
        } catch (error) {
          textContent = `File reading failed: ${error.message}`;
        }
      }

      // Clean and validate content
      const cleanedContent = textContent
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s.,!?;:()\-\[\]"']/g, ' ')
        .trim();

      const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
      const characterCount = textContent.length;
      const lineCount = textContent.split('\n').length;
      const paragraphCount = textContent.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;

      // Course-specific keyword detection
      const courseKeywords = [
        'entrepreneurship', 'business', 'startup', 'venture', 'innovation', 
        'business plan', 'market', 'revenue', 'profit', 'customer', 'strategy',
        'competition', 'funding', 'investment', 'pitch', 'marketing', 'engineering',
        'thermodynamics', 'mechanics', 'physics', 'mathematics', 'calculus',
        'biology', 'chemistry', 'science', 'research', 'analysis', 'theory'
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
        extractionTimestamp: new Date().toISOString(),
        isContentValid: cleanedContent.length > 100 && !textContent.includes('PDF Text Extraction Issue')
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
        contentLength: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePredictions = async () => {
    if (!extractedContent || !extractedContent.content || extractedContent.error) {
      alert('Please extract content first and ensure there are no errors');
      return;
    }

    setPredictionLoading(true);
    setPredictions(null);

    try {
      console.log('Generating predictions for material:', extractedContent.materialName);
      console.log('Using course:', extractedContent.course);
      console.log('Content length:', extractedContent.content.length);
      
      // Call the generate-predictions function with the extracted content and correct course info
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Material Content Analyzer & Predictor</h1>
          <p className="text-gray-600">Select a material to extract content and generate quality exam predictions</p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-800 text-sm">
              <strong>Note:</strong> This tool works best with text-based files. PDF files with images or scanned content may not extract properly.
            </p>
          </div>
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
                    
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => analyzeMaterial(selectedMaterial)}
                        disabled={loading}
                        className="flex-1"
                      >
                        {loading ? 'Analyzing Content...' : 'Extract & Analyze All Content'}
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
                        <div className="text-sm font-medium text-gray-600">Content Quality</div>
                        <div className={`text-lg font-semibold ${extractedContent.isContentValid ? 'text-green-600' : 'text-red-600'}`}>
                          {extractedContent.isContentValid ? 'Good' : 'Poor'}
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
                            <div className={`border p-4 rounded ${extractedContent.isContentValid ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                              <p className={`mb-2 ${extractedContent.isContentValid ? 'text-green-700' : 'text-amber-700'}`}>
                                {extractedContent.isContentValid ? '✅ Content extracted successfully' : '⚠️ Content extracted but may have quality issues'}
                              </p>
                              <div className={`text-sm ${extractedContent.isContentValid ? 'text-green-600' : 'text-amber-600'}`}>
                                Original: {extractedContent.contentLength.toLocaleString()} characters | 
                                Cleaned: {extractedContent.cleanedContentLength?.toLocaleString() || 'N/A'} characters
                              </div>
                              {!extractedContent.isContentValid && (
                                <div className="mt-2 text-sm text-amber-700">
                                  <strong>Recommendation:</strong> For better predictions, use text files or PDFs with selectable text.
                                </div>
                              )}
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
                              {predictions.generated_content.predictions.slice(0, 20).map((prediction, index) => (
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

                            {predictions.generated_content.predictions.length > 20 && (
                              <div className="mt-4 text-center text-gray-500">
                                Showing first 20 predictions out of {predictions.generated_content.predictions.length} total
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
