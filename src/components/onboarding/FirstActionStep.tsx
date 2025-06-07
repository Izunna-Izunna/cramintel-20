
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { OnboardingData } from '@/pages/Onboarding';

interface FirstActionStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const firstActions = [
  {
    id: 'upload',
    title: 'Upload a past question',
    emoji: '📤',
    description: 'Get started with exam predictions'
  },
  {
    id: 'summarize',
    title: 'Summarize my notes',
    emoji: '🧠',
    description: 'Turn long notes into key points'
  },
  {
    id: 'predict',
    title: 'Predict my exam questions',
    emoji: '🔮',
    description: 'See what might come up in your exam'
  },
  {
    id: 'explore',
    title: 'Just explore first',
    emoji: '👀',
    description: 'Take a look around the platform'
  }
];

const FirstActionStep = ({ data, updateData, nextStep, prevStep }: FirstActionStepProps) => {
  const [selectedAction, setSelectedAction] = useState(data.firstAction);

  const handleContinue = () => {
    updateData({ firstAction: selectedAction });
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
        <h2 className="text-2xl font-bold text-gray-900">What would you like CramIntel to do first? 🧪</h2>
        <p className="text-gray-600">Choose your starting point</p>
      </div>

      <motion.div
        className="space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {firstActions.map((action, index) => (
          <motion.button
            key={action.id}
            onClick={() => setSelectedAction(action.id)}
            className={`w-full p-4 rounded-lg border text-left transition-all ${
              selectedAction === action.id
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
              <div className="text-2xl">{action.emoji}</div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{action.title}</div>
                <div className="text-sm text-gray-600">{action.description}</div>
              </div>
              {selectedAction === action.id && (
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
          disabled={!selectedAction}
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

export default FirstActionStep;
