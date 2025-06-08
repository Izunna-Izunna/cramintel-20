
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Brain, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProcessingStep {
  name: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  data?: any;
  error?: string;
}

export default function TestPdfExtraction() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [steps, setSteps] = useState<ProcessingStep[]>([
    { name: 'File Upload', status: 'pending' },
    { name: 'Text Extraction', status: 'pending' },
    { name: 'Content Analysis', status: 'pending' },
    { name: 'Flashcard Generation', status: 'pending' }
  ]);
  const [extractedText, setExtractedText] = useState('');
  const [generatedFlashcards, setGeneratedFlashcards] = useState([]);
  const [logs, setLogs] = useState<string[]>([]);

  const { user } = useAuth();
  const { toast } = useToast();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[PDF Test] ${message}`);
  };

  const updateStep = (stepIndex: number, status: ProcessingStep['status'], data?: any, error?: string) => {
    setSteps(prev => prev.map((step, index) => 
      index === stepIndex ? { ...step, status, data, error } : step
    ));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      addLog(`Selected file: ${selectedFile.name} (${selectedFile.size} bytes)`);
      
      // Reset everything
      setExtractedText('');
      setGeneratedFlashcards([]);
      setSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));
    }
  };

  const testDirectExtraction = async () => {
    if (!file || !user) return;

    setProcessing(true);
    addLog('Starting direct PDF extraction test...');

    try {
      // Step 1: Upload file
      updateStep(0, 'processing');
      addLog('Uploading file to storage...');

      const fileExt = file.name.split('.').pop();
      const fileName = `test-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('cramintel-materials')
        .upload(filePath, file);

      if (uploadError) {
        addLog(`Upload error: ${uploadError.message}`);
        updateStep(0, 'error', null, uploadError.message);
        return;
      }

      updateStep(0, 'complete', { filePath });
      addLog(`File uploaded successfully to: ${filePath}`);

      // Step 2: Test text extraction
      updateStep(1, 'processing');
      addLog('Testing text extraction...');

      const { data: fileData, error: downloadError } = await supabase.storage
        .from('cramintel-materials')
        .download(filePath);

      if (downloadError) {
        addLog(`Download error: ${downloadError.message}`);
        updateStep(1, 'error', null, downloadError.message);
        return;
      }

      addLog(`Downloaded file for extraction: ${fileData.size} bytes`);

      // Import PDF extraction library dynamically
      try {
        // Note: This would normally be done in the edge function
        addLog('PDF extraction would happen in edge function - simulating...');
        
        // Create a FormData to test the actual upload-material function
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', `Test PDF - ${file.name}`);
        formData.append('course', 'TEST COURSE');
        formData.append('materialType', 'notes');

        updateStep(1, 'complete');
        addLog('Text extraction simulation complete');

        // Step 3: Test actual processing
        updateStep(2, 'processing');
        addLog('Calling upload-material function...');

        const { data: { session } } = await supabase.auth.getSession();
        
        const { data: uploadResult, error: functionError } = await supabase.functions.invoke('upload-material', {
          body: formData,
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          }
        });

        if (functionError) {
          addLog(`Function error: ${functionError.message}`);
          updateStep(2, 'error', null, functionError.message);
          return;
        }

        addLog(`Upload function response: ${JSON.stringify(uploadResult)}`);
        updateStep(2, 'complete', uploadResult);

        if (uploadResult.success && uploadResult.material) {
          // Step 4: Monitor processing
          updateStep(3, 'processing');
          addLog(`Material created with ID: ${uploadResult.material.id}`);
          
          // Poll for processing status
          const materialId = uploadResult.material.id;
          let attempts = 0;
          const maxAttempts = 30; // 1 minute
          
          const pollStatus = async () => {
            try {
              const { data: material, error } = await supabase
                .from('cramintel_materials')
                .select('processed, processing_status, processing_progress')
                .eq('id', materialId)
                .single();

              if (error) {
                addLog(`Polling error: ${error.message}`);
                return;
              }

              addLog(`Status: ${material.processing_status}, Progress: ${material.processing_progress}%`);

              if (material.processed) {
                addLog('Material processing completed!');
                
                // Get flashcards
                const { data: flashcards, error: flashcardsError } = await supabase
                  .from('cramintel_flashcards')
                  .select('*')
                  .eq('material_id', materialId);

                if (flashcardsError) {
                  addLog(`Error fetching flashcards: ${flashcardsError.message}`);
                } else {
                  addLog(`Generated ${flashcards?.length || 0} flashcards`);
                  setGeneratedFlashcards(flashcards || []);
                  
                  // Show sample content
                  if (flashcards && flashcards.length > 0) {
                    addLog(`Sample flashcard: ${flashcards[0].question}`);
                  }
                }
                
                updateStep(3, 'complete', { flashcards });
                return;
              }

              if (material.processing_status === 'error') {
                addLog('Material processing failed');
                updateStep(3, 'error', null, 'Processing failed');
                return;
              }

              attempts++;
              if (attempts < maxAttempts) {
                setTimeout(pollStatus, 2000);
              } else {
                addLog('Polling timeout reached');
                updateStep(3, 'error', null, 'Processing timeout');
              }
            } catch (pollError) {
              addLog(`Polling error: ${pollError.message}`);
            }
          };

          pollStatus();
        }

      } catch (extractError) {
        addLog(`Extraction error: ${extractError.message}`);
        updateStep(1, 'error', null, extractError.message);
      }

      // Clean up test file
      await supabase.storage
        .from('cramintel-materials')
        .remove([filePath]);
      
      addLog('Test file cleaned up');

    } catch (error) {
      addLog(`Test error: ${error.message}`);
      toast({
        title: "Test Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStepIcon = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'complete': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing': return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />;
    }
  };

  const getProgress = () => {
    const completedSteps = steps.filter(step => step.status === 'complete').length;
    return (completedSteps / steps.length) * 100;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">PDF Extraction Test</h1>
          <p className="text-gray-600">Test the PDF extraction and flashcard generation pipeline</p>
        </div>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Test PDF
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              disabled={processing}
            />
            
            {file && (
              <Alert>
                <FileText className="w-4 h-4" />
                <AlertDescription>
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={testDirectExtraction} 
              disabled={!file || processing || !user}
              className="w-full"
            >
              {processing ? "Testing..." : "Start Extraction Test"}
            </Button>
          </CardContent>
        </Card>

        {/* Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Processing Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={getProgress()} className="h-2" />
            
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  {getStepIcon(step.status)}
                  <div className="flex-1">
                    <p className="font-medium">{step.name}</p>
                    {step.error && (
                      <p className="text-sm text-red-600">{step.error}</p>
                    )}
                  </div>
                  <span className="text-sm text-gray-500 capitalize">{step.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {generatedFlashcards.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Generated Flashcards ({generatedFlashcards.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {generatedFlashcards.slice(0, 5).map((card, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <p className="font-medium text-sm mb-2">Q: {card.question}</p>
                    <p className="text-sm text-gray-600">A: {card.answer}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Difficulty: {card.difficulty_level}
                    </p>
                  </div>
                ))}
                {generatedFlashcards.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    ... and {generatedFlashcards.length - 5} more flashcards
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Debug Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={logs.join('\n')}
              readOnly
              className="min-h-40 font-mono text-sm"
              placeholder="Logs will appear here..."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
