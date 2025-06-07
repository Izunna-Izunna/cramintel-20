
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { OnboardingData } from '@/pages/Onboarding';

interface StudyStyleStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const studyStyles = [
  {
    id: 'thorough',
    title: 'I read everything',
    emoji: '📚',
    description: 'You like to understand every detail'
  },
  {
    id: 'lastminute',
    title: 'I cram last minute',
    emoji: '🔄',
    description: 'You work best under pressure'
  },
  {
    id: 'audio',
    title: 'I learn better with audio',
    emoji: '🎧',
    description: 'You prefer listening to explanations'
  },
  {
    id: 'ai',
    title: 'AI better teach me like a human',
    emoji: '🤖',
    description: 'You want personalized AI tutoring'
  }
];

const StudyStyleStep = ({ data, updateData, nextStep, prevStep }: StudyStyleStepProps) => {
  const [selectedStyle, setSelectedStyle] = useState(data.studyStyle);

  const handleContinue = () => {
    updateData({ studyStyle: selectedStyle });
    nextStep();
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">How do you like to study? 🔄</h2>
        <p className="text-gray-600">This helps us personalize your experience</p>
      </div>

      <motion.div
        className="space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {studyStyles.map((style, index) => (
          <motion.button
            key={style.id}
            onClick={() => setSelectedStyle(style.id)}
            className={`w-full p-4 rounded-lg border text-left transition-all ${
              selectedStyle === style.id
                ? 'border-gray-800 bg-gray-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{style.emoji}</div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{style.title}</div>
                <div className="text-sm text-gray-600">{style.description}</div>
              </div>
              {selectedStyle === style.id && (
                <motion.div
                  className="text-gray-800"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  ✓
                </motion.div>
              )}
            </div>
          </motion.button>
        ))}
      </motion.div>

      <div className="flex flex-col space-y-3">
        <Button
          onClick={handleContinue}
          className="w-full bg-gray-800 hover:bg-gray-700 text-white"
          disabled={!selectedStyle}
        >
          Continue
        </Button>
        
        <Button
          onClick={prevStep}
          variant="ghost"
          className="w-full text-gray-500 hover:text-gray-700"
        >
          ← Back
        </Button>
      </div>
    </motion.div>
  );
};

export default StudyStyleStep;
