
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OnboardingData } from '@/pages/Onboarding';

interface NameStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const NameStep = ({ data, updateData, nextStep, prevStep }: NameStepProps) => {
  const [name, setName] = useState(data.name);

  const handleContinue = () => {
    updateData({ name: name.trim() || 'Genius' });
    nextStep();
  };

  const handleSkip = () => {
    updateData({ name: 'Genius' });
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
        <h2 className="text-2xl font-bold text-gray-900">What's your name?</h2>
        <p className="text-gray-600">Let's get to know you better</p>
      </div>

      <motion.div
        className="space-y-4"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="relative">
          <Input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-center text-lg py-3"
            autoFocus
          />
        </div>

        <div className="flex flex-col space-y-3">
          <Button
            onClick={handleContinue}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white"
            disabled={!name.trim()}
          >
            Continue
          </Button>
          
          <Button
            onClick={handleSkip}
            variant="ghost"
            className="w-full text-gray-600 hover:text-gray-800"
          >
            Just call me Genius 😎
          </Button>
        </div>
      </motion.div>

      <Button
        onClick={prevStep}
        variant="ghost"
        className="w-full text-gray-500 hover:text-gray-700"
      >
        ← Back
      </Button>
    </motion.div>
  );
};

export default NameStep;
