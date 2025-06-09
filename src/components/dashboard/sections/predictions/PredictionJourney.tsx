
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { StartPredictionStep } from './StartPredictionStep';
import { UploadCluesStep } from './UploadCluesStep';
import { TagContextStep } from './TagContextStep';
import { StyleSelectionStep } from './StyleSelectionStep';
import { GenerationStep } from './GenerationStep';
import { PredictionResults } from './PredictionResults';

type Step = 'start' | 'upload-clues' | 'tag-context' | 'style-selection' | 'generating' | 'results';
type PredictionStyle = 'bullet' | 'theory' | 'mixed' | 'exam-paper';

interface ExamContext {
  examType: string;
  timeframe: string;
  difficulty: string;
  course: string;
  examDate: string;
}

export function PredictionJourney() {
  const [currentStep, setCurrentStep] = useState<Step>('start');
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [examContext, setExamContext] = useState<ExamContext>({
    examType: '',
    timeframe: '',
    difficulty: 'medium',
    course: '',
    examDate: ''
  });
  const [selectedStyle, setSelectedStyle] = useState<PredictionStyle>('bullet');
  const [generatedPrediction, setGeneratedPrediction] = useState(null);

  const handleNext = () => {
    switch (currentStep) {
      case 'start':
        setCurrentStep('upload-clues');
        break;
      case 'upload-clues':
        setCurrentStep('tag-context');
        break;
      case 'tag-context':
        setCurrentStep('style-selection');
        break;
      case 'style-selection':
        setCurrentStep('generating');
        break;
      case 'generating':
        setCurrentStep('results');
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'upload-clues':
        setCurrentStep('start');
        break;
      case 'tag-context':
        setCurrentStep('upload-clues');
        break;
      case 'style-selection':
        setCurrentStep('tag-context');
        break;
      case 'generating':
        setCurrentStep('style-selection');
        break;
      case 'results':
        setCurrentStep('generating');
        break;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'start':
        return <StartPredictionStep onNext={handleNext} />;
      case 'upload-clues':
        return (
          <UploadCluesStep
            selectedMaterials={selectedMaterials}
            onMaterialsChange={setSelectedMaterials}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'tag-context':
        return (
          <TagContextStep
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            examContext={examContext}
            onExamContextChange={setExamContext}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'style-selection':
        return (
          <StyleSelectionStep
            selectedStyle={selectedStyle}
            onStyleChange={setSelectedStyle}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'generating':
        return (
          <GenerationStep
            selectedMaterials={selectedMaterials}
            selectedTags={selectedTags}
            examContext={examContext}
            selectedStyle={selectedStyle}
            onComplete={(prediction) => {
              setGeneratedPrediction(prediction);
              handleNext();
            }}
            onBack={handleBack}
          />
        );
      case 'results':
        return (
          <PredictionResults
            prediction={generatedPrediction}
            onBack={handleBack}
            onStartNew={() => {
              setCurrentStep('start');
              setSelectedMaterials([]);
              setSelectedTags([]);
              setExamContext({
                examType: '',
                timeframe: '',
                difficulty: 'medium',
                course: '',
                examDate: ''
              });
              setSelectedStyle('bullet');
              setGeneratedPrediction(null);
            }}
          />
        );
      default:
        return <StartPredictionStep onNext={handleNext} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {renderStep()}
        </motion.div>
      </div>
    </div>
  );
}
