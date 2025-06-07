
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { OnboardingData } from '@/pages/Onboarding';

interface WelcomeStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const WelcomeStep = ({ nextStep }: WelcomeStepProps) => {
  return (
    <motion.div
      className="text-center space-y-6"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="text-6xl mb-4">🎓</div>
      </motion.div>
      
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Hey there 👋 Welcome to CramIntel
        </h1>
        <p className="text-gray-600 text-lg">
          Your new exam prep sidekick
        </p>
        <p className="text-gray-500">
          We'll get you set up in less than 60 seconds.
        </p>
      </div>

      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={nextStep}
          className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 text-lg"
        >
          Let's Go! 🚀
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default WelcomeStep;
