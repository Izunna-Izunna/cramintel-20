
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Brain, FileText, CheckCircle } from 'lucide-react';

interface ExamContext {
  examType: string;
  timeframe: string;
  difficulty: string;
  course: string;
  examDate: string;
}

interface GenerationStepProps {
  selectedMaterials: string[];
  selectedTags: string[];
  examContext: ExamContext;
  selectedStyle: string;
  onComplete: (prediction: any) => void;
  onBack: () => void;
}

export function GenerationStep({
  selectedMaterials,
  selectedTags,
  examContext,
  selectedStyle,
  onComplete,
  onBack
}: GenerationStepProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('analyzing');
  const [isComplete, setIsComplete] = useState(false);

  const steps = [
    { id: 'analyzing', label: 'Analyzing your materials', icon: FileText },
    { id: 'processing', label: 'Processing context & tags', icon: Brain },
    { id: 'generating', label: 'Generating predictions', icon: Sparkles },
    { id: 'complete', label: 'Ready!', icon: CheckCircle }
  ];

  useEffect(() => {
    const generatePredictions = async () => {
      // Simulate the generation process
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i].id);
        
        // Animate progress for each step
        const stepProgress = (i / (steps.length - 1)) * 100;
        setProgress(stepProgress);
        
        // Wait for each step
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Mock prediction result
      const mockPrediction = {
        id: 'pred-123',
        style: selectedStyle,
        course: examContext.course,
        exam_date: examContext.examDate,
        confidence_score: 87,
        questions: [
          {
            id: 1,
            text: "Explain the first law of thermodynamics and provide a practical example.",
            confidence: 95,
            type: "theory",
            tags: selectedTags.slice(0, 2)
          },
          {
            id: 2,
            text: "Calculate the efficiency of a Carnot engine operating between 400K and 300K.",
            confidence: 89,
            type: "calculation",
            tags: selectedTags.slice(1, 3)
          },
          {
            id: 3,
            text: "Describe the relationship between entropy and the second law of thermodynamics.",
            confidence: 82,
            type: "theory",
            tags: selectedTags.slice(0, 1)
          }
        ],
        generated_at: new Date().toISOString(),
        materials_used: selectedMaterials,
        tags_used: selectedTags,
        exam_context: examContext
      };

      setIsComplete(true);
      setTimeout(() => {
        onComplete(mockPrediction);
      }, 1000);
    };

    generatePredictions();
  }, [selectedMaterials, selectedTags, examContext, selectedStyle, onComplete]);

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Generating Your Predictions</h3>
        <p className="text-gray-600">This will take a few moments...</p>
      </div>

      <Card>
        <CardContent className="p-8">
          <div className="space-y-6">
            {/* Progress Bar */}
            <div>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-gray-600 mt-2 text-center">{Math.round(progress)}% complete</p>
            </div>

            {/* Steps */}
            <div className="space-y-4">
              {steps.map((step, index) => {
                const currentIndex = getCurrentStepIndex();
                const isActive = index === currentIndex;
                const isCompleted = index < currentIndex || isComplete;
                const Icon = step.icon;

                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isActive ? 'bg-blue-50 border border-blue-200' :
                      isCompleted ? 'bg-green-50 border border-green-200' :
                      'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isActive ? 'bg-blue-500 text-white' :
                      isCompleted ? 'bg-green-500 text-white' :
                      'bg-gray-300 text-gray-600'
                    }`}>
                      {isActive ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Icon className="w-4 h-4" />
                        </motion.div>
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <span className={`font-medium ${
                      isActive ? 'text-blue-700' :
                      isCompleted ? 'text-green-700' :
                      'text-gray-600'
                    }`}>
                      {step.label}
                    </span>
                    {isCompleted && (
                      <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">
                Processing {selectedMaterials.length} materials with {selectedTags.length} tags
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Style: {selectedStyle} • Course: {examContext.course}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center mt-6">
        <Button variant="outline" onClick={onBack} disabled={!isComplete}>
          Back
        </Button>
      </div>
    </div>
  );
}
