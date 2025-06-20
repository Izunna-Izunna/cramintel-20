
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ProgressSteps } from '@/components/dashboard/ProgressSteps';
import { StartPredictionStep } from './StartPredictionStep';
import { UploadCluesStep } from './UploadCluesStep';
import { TagContextStep } from './TagContextStep';
import { StyleSelectionStep } from './StyleSelectionStep';
import { GenerationStep } from './GenerationStep';
import { PredictionResults } from './PredictionResults';
import { ExamPaperView } from './ExamPaperView';
import { PredictionResponse } from '@/types/predictions';

interface PredictionJourneyProps {
  onClose: () => void;
}

export type PredictionStep = 1 | 2 | 3 | 4 | 5 | 'results';

interface PredictionData {
  selectedMaterials: string[];
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
  generatedContent?: PredictionResponse;
}

export function PredictionJourney({ onClose }: PredictionJourneyProps) {
  const [currentStep, setCurrentStep] = useState<PredictionStep>(1);
  const [predictionData, setPredictionData] = useState<PredictionData>({
    selectedMaterials: [],
    clues: [],
    context: {
      course: '',
      topics: [],
    },
    style: 'bullet'
  });

  const getCurrentStepNumber = (step: PredictionStep): number => {
    return step === 'results' ? 6 : step;
  };

  const stepTitles = ['Start', 'Upload', 'Tag', 'Style', 'Generate'];

  const handleNext = () => {
    if (currentStep === 5) {
      setCurrentStep('results');
    } else if (typeof currentStep === 'number' && currentStep < 5) {
      setCurrentStep((prev) => (prev as number + 1) as PredictionStep);
    }
  };

  const handleBack = () => {
    if (currentStep === 'results') {
      setCurrentStep(5);
    } else if (typeof currentStep === 'number' && currentStep > 1) {
      setCurrentStep((prev) => (prev as number - 1) as PredictionStep);
    }
  };

  const handleGenerationComplete = (generatedContent: PredictionResponse) => {
    console.log('Generation complete, received content:', generatedContent);
    setPredictionData(prev => ({
      ...prev,
      generatedContent
    }));
    setCurrentStep('results');
  };

  // Transform selectedMaterials to clues format when needed
  const getTransformedData = (): PredictionData => {
    const clues = predictionData.selectedMaterials.map((materialId, index) => ({
      id: `material-${index}`,
      name: `Material ${index + 1}`,
      type: 'past-questions' as const,
      materialId: materialId,
    }));

    return {
      ...predictionData,
      clues: predictionData.clues.length > 0 ? predictionData.clues : clues
    };
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <StartPredictionStep onNext={handleNext} />;
      case 2:
        return (
          <UploadCluesStep
            selectedMaterials={predictionData.selectedMaterials}
            onMaterialsChange={(materials) => setPredictionData(prev => ({ ...prev, selectedMaterials: materials }))}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <TagContextStep
            context={predictionData.context}
            onContextChange={(context) => setPredictionData(prev => ({ ...prev, context }))}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <StyleSelectionStep
            selectedStyle={predictionData.style}
            onStyleChange={(style) => setPredictionData(prev => ({ ...prev, style }))}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 5:
        return (
          <GenerationStep
            predictionData={getTransformedData()}
            onNext={handleNext}
            onBack={handleBack}
            onGenerationComplete={handleGenerationComplete}
          />
        );
      case 'results':
        return predictionData.style === 'exam-paper' ? (
          <ExamPaperView
            predictionData={getTransformedData()}
            onBack={handleBack}
            onClose={onClose}
          />
        ) : (
          <PredictionResults
            predictionData={getTransformedData()}
            onBack={handleBack}
            onClose={onClose}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-auto"
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {currentStep !== 1 && currentStep !== 'results' && (
              <Button variant="ghost" size="sm" onClick={handleBack} className="hover:bg-gray-100">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <h2 className="text-xl font-bold text-gray-800">AI Predictions Journey</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-gray-100">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {currentStep !== 'results' && (
          <div className="p-6 border-b border-gray-100">
            <ProgressSteps steps={stepTitles} currentStep={getCurrentStepNumber(currentStep)} />
          </div>
        )}

        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderCurrentStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
