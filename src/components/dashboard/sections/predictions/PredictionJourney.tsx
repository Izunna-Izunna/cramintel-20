
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ArrowLeft, ArrowRight, Sparkles, Target, FileText, Zap } from 'lucide-react';
import { ProgressSteps } from '@/components/dashboard/ProgressSteps';
import { StartPredictionStep } from './StartPredictionStep';
import { UploadCluesStep } from './UploadCluesStep';
import { TagContextStep } from './TagContextStep';
import { StyleSelectionStep } from './StyleSelectionStep';
import { GenerationStep } from './GenerationStep';
import { PredictionResults } from './PredictionResults';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type PredictionStep = 1 | 2 | 3 | 4 | 5 | 'results';

interface PredictionData {
  selectedMaterials: string[];
  context: {
    course: string;
    topics: string[];
    examType: string;
    difficulty: string;
  };
  style: string;
}

interface PredictionJourneyProps {
  onClose: () => void;
}

export function PredictionJourney({ onClose }: PredictionJourneyProps) {
  const [currentStep, setCurrentStep] = useState<PredictionStep>(1);
  const [predictionData, setPredictionData] = useState<PredictionData>({
    selectedMaterials: [],
    context: {
      course: '',
      topics: [],
      examType: '',
      difficulty: '',
    },
    style: ''
  });
  const [generatedPrediction, setGeneratedPrediction] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleNext = () => {
    if (currentStep === 5) {
      handleGenerate();
    } else {
      setCurrentStep((prev) => {
        if (prev === 1) return 2;
        if (prev === 2) return 3;
        if (prev === 3) return 4;
        if (prev === 4) return 5;
        return prev;
      });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => {
      if (prev === 2) return 1;
      if (prev === 3) return 2;
      if (prev === 4) return 3;
      if (prev === 5) return 4;
      return prev;
    });
  };

  const handleGenerate = async () => {
    if (!user || predictionData.selectedMaterials.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select materials and ensure you're logged in.",
        variant: "destructive"
      });
      return;
    }

    setCurrentStep('results');
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-predictions', {
        body: {
          materialIds: predictionData.selectedMaterials,
          context: predictionData.context,
          style: predictionData.style
        }
      });

      if (error) throw error;
      
      setGeneratedPrediction(data);
      
      toast({
        title: "Prediction Generated! 🎯",
        description: "Your exam predictions are ready for review.",
      });
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: "There was an error generating your predictions. Please try again.",
        variant: "destructive"
      });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StartPredictionStep
            context={predictionData.context}
            onContextChange={(context) => setPredictionData(prev => ({ ...prev, context }))}
            onNext={handleNext}
            onBack={onClose}
          />
        );
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
            selectedMaterials={predictionData.selectedMaterials}
            context={predictionData.context}
            onContextChange={(context) => setPredictionData(prev => ({ ...prev, context }))}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <StyleSelectionStep
            style={predictionData.style}
            onStyleChange={(style) => setPredictionData(prev => ({ ...prev, style }))}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 5:
        return (
          <GenerationStep
            predictionData={predictionData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'results':
        return (
          <PredictionResults
            prediction={generatedPrediction}
            onClose={onClose}
            onBack={() => setCurrentStep(5)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Generate Predictions</h2>
              <p className="text-gray-600">AI-powered exam predictions based on your materials</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {currentStep !== 'results' && (
          <div className="px-6 py-4 border-b">
            <ProgressSteps 
              currentStep={typeof currentStep === 'number' ? currentStep : 5} 
              totalSteps={5}
            />
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
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
