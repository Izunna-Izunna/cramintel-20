
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface ExamContext {
  examType: string;
  timeframe: string;
  difficulty: string;
  course: string;
  examDate: string;
}

interface GenerationStepProps {
  materials: string[];
  tags: string[];
  examContext: ExamContext;
  selectedStyle: string;
  onComplete: (prediction: any) => void;
  onBack: () => void;
}

export function GenerationStep({ 
  materials, 
  tags, 
  examContext, 
  selectedStyle, 
  onComplete, 
  onBack 
}: GenerationStepProps) {
  const [progress, setProgress] = React.useState(0);
  const [currentStep, setCurrentStep] = React.useState('Analyzing materials...');

  useEffect(() => {
    const steps = [
      'Analyzing materials...',
      'Processing content...',
      'Identifying patterns...',
      'Generating predictions...',
      'Finalizing results...'
    ];

    let currentStepIndex = 0;
    let currentProgress = 0;

    const interval = setInterval(() => {
      currentProgress += Math.random() * 15 + 5;
      
      if (currentProgress >= 100) {
        currentProgress = 100;
        setProgress(100);
        setCurrentStep('Complete!');
        
        setTimeout(() => {
          const mockPrediction = {
            id: Date.now().toString(),
            course: examContext.course,
            examType: examContext.examType,
            difficulty: examContext.difficulty,
            predictions: [
              'Question about data structures and algorithms',
              'Theory questions on time complexity',
              'Practical implementation problems',
              'Questions on specific programming concepts'
            ],
            confidence: Math.floor(Math.random() * 20) + 80
          };
          onComplete(mockPrediction);
        }, 1000);
        
        clearInterval(interval);
        return;
      }

      if (currentProgress > (currentStepIndex + 1) * 20) {
        currentStepIndex = Math.min(currentStepIndex + 1, steps.length - 1);
        setCurrentStep(steps[currentStepIndex]);
      }

      setProgress(Math.min(currentProgress, 100));
    }, 500);

    return () => clearInterval(interval);
  }, [examContext, onComplete]);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Generating Your Exam Prediction</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🔮</div>
          <h3 className="text-xl font-semibold mb-2">Creating Your Prediction</h3>
          <p className="text-gray-600">{currentStep}</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Processing:</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Materials: {materials.length} files</div>
            <div>Tags: {tags.join(', ')}</div>
            <div>Course: {examContext.course}</div>
            <div>Style: {selectedStyle}</div>
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack} disabled={progress > 0}>
            Back
          </Button>
          <div className="text-sm text-gray-500">
            This may take a few moments...
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
