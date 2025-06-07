
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
    <div className="space-y-8 relative max-w-lg mx-auto">
      <motion.div 
        className="text-center space-y-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
      >
        <motion.h2 
          className="text-3xl font-bold text-white"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          What would you like CramIntel to do first? 🧪
        </motion.h2>
        <motion.p 
          className="text-white/70 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Choose your starting point
        </motion.p>
      </motion.div>

      <motion.div
        className="space-y-6"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
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
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                selectedAction === action.id
                  ? 'border-blue-500 bg-blue-500/20 backdrop-blur-sm'
                  : 'border-white/20 bg-white/10 backdrop-blur-sm hover:border-white/40'
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
                  <div className="font-medium text-white">{action.title}</div>
                  <div className="text-sm text-white/70">{action.description}</div>
                </div>
                {selectedAction === action.id && (
                  <motion.div
                    className="text-blue-400"
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

        <div className="flex flex-col space-y-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleContinue}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-2xl font-semibold text-lg shadow-xl"
              disabled={!selectedAction}
            >
              Continue
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={prevStep}
          variant="ghost"
          className="w-full text-white/60 hover:text-white/80 py-3 rounded-2xl"
        >
          ← Back
        </Button>
      </motion.div>
    </div>
  );
};

export default FirstActionStep;
