
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
          How do you like to study? 🔄
        </motion.h2>
        <motion.p 
          className="text-white/70 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          This helps us personalize your experience
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
          {studyStyles.map((style, index) => (
            <motion.button
              key={style.id}
              onClick={() => setSelectedStyle(style.id)}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                selectedStyle === style.id
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
                <div className="text-2xl">{style.emoji}</div>
                <div className="flex-1">
                  <div className="font-medium text-white">{style.title}</div>
                  <div className="text-sm text-white/70">{style.description}</div>
                </div>
                {selectedStyle === style.id && (
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
              disabled={!selectedStyle}
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

export default StudyStyleStep;
