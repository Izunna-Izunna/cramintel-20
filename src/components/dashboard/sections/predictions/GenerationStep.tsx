
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PredictionResponse } from '@/types/predictions';

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
  style: 'bullet' | 'theory' | 'mixed' | 'exam-paper' | 'ranked' | 'practice_exam' | 'topic_based';
}

interface GenerationStepProps {
  predictionData: PredictionData;
  onNext: () => void;
  onBack: () => void;
  onGenerationComplete: (generatedContent: PredictionResponse) => void;
}

export function GenerationStep({ predictionData, onNext, onBack, onGenerationComplete }: GenerationStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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
        setProgress(((i + 1) / tasks.length) * 80); // Leave 20% for final processing
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      setCurrentTask('Calling AI service...');
      setProgress(85);

      // Get material content for clues that reference materials
      const enrichedClues = await Promise.all(
        predictionData.clues.map(async (clue) => {
          if (clue.materialId && !clue.content) {
            try {
              const { data: material } = await supabase
                .from('cramintel_materials')
                .select('name, material_type, course')
                .eq('id', clue.materialId)
                .single();
              
              return {
                ...clue,
                content: material ? `Material: ${material.name} (${material.material_type}) from ${material.course}` : clue.name
              };
            } catch (err) {
              console.error('Error fetching material:', err);
              return clue;
            }
          }
          return clue;
        })
      );

      setProgress(90);
      setCurrentTask('Processing with AI...');

      console.log('Calling edge function with data:', {
        clues: enrichedClues,
        context: predictionData.context,
        style: predictionData.style
      });

      // Call the edge function
      const { data, error: functionError } = await supabase.functions.invoke('generate-predictions', {
        body: {
          clues: enrichedClues,
          context: predictionData.context,
          style: predictionData.style
        }
      });

      console.log('Edge function response:', data);
      console.log('Edge function error:', functionError);

      if (functionError) {
        console.error('Edge function error:', functionError);
        
        // Provide more specific error messages
        let errorMessage = 'Failed to generate predictions';
        if (functionError.message?.includes('not configured')) {
          errorMessage = 'AI service is not properly configured. Please contact support.';
        } else if (functionError.message?.includes('Unauthorized')) {
          errorMessage = 'Authentication error. Please try logging out and back in.';
        } else if (functionError.message?.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again with fewer materials.';
        } else if (functionError.message) {
          errorMessage = functionError.message;
        }
        
        throw new Error(errorMessage);
      }

      // Handle the new response structure
      if (!data?.success) {
        const errorMsg = data?.error || 'Unknown error occurred during prediction generation';
        console.error('Prediction generation failed:', errorMsg);
        throw new Error(errorMsg);
      }

      if (!data.data?.predictions || !Array.isArray(data.data.predictions)) {
        console.error('Invalid prediction data received:', data);
        throw new Error('Invalid predictions data received from server');
      }

      setProgress(100);
      setCurrentTask('Predictions generated successfully!');
      
      // Call the completion handler with the generated content
      console.log('Calling onGenerationComplete with:', data.data);
      onGenerationComplete(data.data);
      
      toast({
        title: "Success!",
        description: "Your predictions have been generated and saved.",
      });
      
      // Wait a moment before proceeding
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onNext();
    } catch (err) {
      console.error('Error generating predictions:', err);
      
      // More user-friendly error messages
      let errorMessage = 'An error occurred while generating predictions';
      
      if (err instanceof Error) {
        if (err.message.includes('fetch') || err.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (err.message.includes('JSON') || err.message.includes('parse')) {
          errorMessage = 'Server response error. Please try again or contact support.';
        } else if (err.message.includes('Unauthorized')) {
          errorMessage = 'Authentication error. Please try logging out and back in.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again with fewer materials.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
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
          className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <Brain className="w-8 h-8 text-gray-600" />
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
              <p className="text-red-600 mb-4 whitespace-pre-wrap">{error}</p>
              <div className="space-y-2">
                <Button onClick={generatePredictions} className="bg-gray-800 hover:bg-gray-900 text-white">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <p className="text-sm text-gray-500">
                  If the problem persists, try reducing the number of materials or contact support.
                </p>
              </div>
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
                    className="bg-gray-800 h-2 rounded-full"
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
                      <Sparkles className="w-5 h-5 text-gray-500" />
                    </motion.div>
                  )}
                  <span className="text-gray-700">{currentTask}</span>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Analysis Summary:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Course: {predictionData.context.course}</li>
                    <li>• Topics: {predictionData.context.topics.join(', ') || 'Not specified'}</li>
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
          <Button variant="outline" onClick={onBack} className="border-gray-300 text-gray-700 hover:bg-gray-50">Back to Style</Button>
          <Button onClick={onNext} className="bg-gray-800 hover:bg-gray-900 text-white">
            View Results
          </Button>
        </div>
      )}

      {!isGenerating && error && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack} className="border-gray-300 text-gray-700 hover:bg-gray-50">Back to Style</Button>
          <Button onClick={generatePredictions} className="bg-gray-800 hover:bg-gray-900 text-white">
            <Sparkles className="w-4 h-4 mr-2" />
            Retry Generation
          </Button>
        </div>
      )}
    </div>
  );
}
