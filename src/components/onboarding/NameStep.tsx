
import React, { useState, useEffect } from 'react';
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
  const [showCelebration, setShowCelebration] = useState(false);

  const handleContinue = () => {
    updateData({ name: name.trim() || 'Genius' });
    setShowCelebration(true);
    setTimeout(() => nextStep(), 800);
  };

  const handleSkip = () => {
    updateData({ name: 'Genius' });
    setShowCelebration(true);
    setTimeout(() => nextStep(), 800);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (e.target.value.length > 0 && !showCelebration) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 1000);
    }
  };

  return (
    <motion.div
      className="space-y-6 relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: "spring" }}
    >
      {/* Celebration particles */}
      {showCelebration && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [1, 1, 0],
                y: [-20, -100],
              }}
              transition={{ duration: 1.5 }}
            />
          ))}
        </div>
      )}

      <motion.div 
        className="text-center space-y-3"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.h2 
          className="text-3xl font-bold text-gray-900"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          What's your name?
        </motion.h2>
        <motion.p 
          className="text-gray-600 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Let's get to know you better
        </motion.p>
      </motion.div>

      <motion.div
        className="space-y-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <motion.div 
          className="relative"
          whileFocus={{ scale: 1.02 }}
        >
          <Input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={handleNameChange}
            className="w-full text-center text-xl py-4 rounded-xl border-2 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
            autoFocus
          />
          {name && (
            <motion.div
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
            >
              <span className="text-green-500 text-xl">✓</span>
            </motion.div>
          )}
        </motion.div>

        {name && (
          <motion.div
            className="bg-gradient-to-r from-green-100 to-blue-100 p-3 rounded-xl border border-green-200"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring" }}
          >
            <p className="text-green-700 font-medium">
              Great to meet you, {name}! 🎉
            </p>
          </motion.div>
        )}

        <div className="flex flex-col space-y-3">
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Button
              onClick={handleContinue}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold"
              disabled={!name.trim()}
            >
              Continue
            </Button>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleSkip}
              variant="ghost"
              className="w-full text-gray-600 hover:text-gray-800 py-3 rounded-xl font-medium hover:bg-gray-100/50"
            >
              Just call me Genius 😎
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
          className="w-full text-gray-500 hover:text-gray-700 py-2 rounded-xl"
        >
          ← Back
        </Button>
      </motion.div>

      {/* Background decorative elements */}
      <div className="absolute -z-10 inset-0 overflow-hidden">
        <motion.div
          className="absolute top-5 right-5 text-3xl opacity-30"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          🌟
        </motion.div>
        <motion.div
          className="absolute bottom-5 left-5 text-2xl opacity-30"
          animate={{ y: [-5, 5, -5] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          👋
        </motion.div>
      </div>
    </motion.div>
  );
};

export default NameStep;
