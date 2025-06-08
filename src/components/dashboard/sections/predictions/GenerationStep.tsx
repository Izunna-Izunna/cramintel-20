
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface PredictionData {
  clues: Array<{
    id: string;
    name: string;
    type: 'past-questions' | 'assignment' | 'whisper';
    content?: string;
    materialId?: string;
  }>;
  context: {
    course: string;
    topics: string[];
    lecturer?: string;
  };
  style: 'bullet' | 'theory' | 'mixed' | 'exam-paper';
}

interface GenerationStepProps {
  predictionData: PredictionData;
  onNext: () => void;
  onBack: () => void;
}

export function GenerationStep({ predictionData, onNext, onBack }: GenerationStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const [error, setError] = useState<string | null>(null);

  const tasks = [
    'Analyzing uploaded materials...',
    'Processing course context...',
    'Identifying patterns and themes...',
    'Generating AI predictions...',
    'Calculating confidence scores...',
    'Finalizing results...'
  ];

  const generatePredictions = async () => {
    setIsGenerating(true);
    setError(null);
    setProgress(0);

    try {
      // Simulate progress through tasks
      for (let i = 0; i < tasks.length; i++) {
        setCurrentTask(tasks[i]);
        setProgress(((i + 1) / tasks.length) * 90); // Leave 10% for final processing
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Get material content for clues that reference materials
      const enrichedClues = await Promise.all(
        predictionData.clues.map(async (clue) => {
          if (clue.materialId && !clue.content) {
            // In a real implementation, you'd fetch the processed content
            // For now, we'll use the material name as content
            const { data: material } = await supabase
              .from('cramintel_materials')
              .select('name, material_type, course')
              .eq('id', clue.materialId)
              .single();
            
            return {
              ...clue,
              content: material ? `Material: ${material.name} (${material.material_type}) from ${material.course}` : clue.name
            };
          }
          return clue;
        })
      );

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('generate-predictions', {
        body: {
          clues: enrichedClues,
          context: predictionData.context,
          style: predictionData.style
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate predictions');
      }

      setProgress(100);
      setCurrentTask('Predictions generated successfully!');
      
      // Wait a moment before proceeding
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onNext();
    } catch (err) {
      console.error('Error generating predictions:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while generating predictions');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    // Auto-start generation when component mounts
    generatePredictions();
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <motion.div
          animate={{ rotate: isGenerating ? 360 : 0 }}
          transition={{ duration: 2, repeat: isGenerating ? Infinity : 0, ease: "linear" }}
          className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <Brain className="w-8 h-8 text-purple-600" />
        </motion.div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          {error ? 'Generation Failed' : isGenerating ? 'Generating Your Predictions' : 'Predictions Complete'}
        </h3>
        <p className="text-gray-600">
          {error ? 'Something went wrong while generating your predictions' : 
           isGenerating ? 'Our AI is analyzing your materials and creating personalized predictions' :
           'Your predictions have been generated successfully'}
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6">
          {error ? (
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={generatePredictions} className="bg-purple-600 hover:bg-purple-700">
                <Sparkles className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-purple-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {progress >= 100 ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Sparkles className="w-5 h-5 text-purple-500" />
                    </motion.div>
                  )}
                  <span className="text-gray-700">{currentTask}</span>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Analysis Summary:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Course: {predictionData.context.course}</li>
                    <li>• Topics: {predictionData.context.topics.join(', ')}</li>
                    <li>• Materials: {predictionData.clues.length} items</li>
                    <li>• Format: {predictionData.style === 'exam-paper' ? 'Full Exam Paper' : 'Question Predictions'}</li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {!isGenerating && !error && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>Back to Style</Button>
          <Button onClick={onNext} className="bg-purple-600 hover:bg-purple-700">
            View Results
          </Button>
        </div>
      )}

      {!isGenerating && error && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>Back to Style</Button>
          <Button onClick={generatePredictions} className="bg-purple-600 hover:bg-purple-700">
            <Sparkles className="w-4 h-4 mr-2" />
            Retry Generation
          </Button>
        </div>
      )}
    </div>
  );
}
