
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
    <div className="space-y-8 relative max-w-md mx-auto">
      {/* Celebration particles */}
      {showCelebration && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-4 h-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [0, 1.5, 0],
                opacity: [1, 1, 0],
                y: [-30, -120],
                rotate: [0, 180],
              }}
              transition={{ duration: 2 }}
            />
          ))}
        </div>
      )}

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
          What should we call you? 👋
        </motion.h2>
        <motion.p 
          className="text-white/70 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Let's personalize your experience
        </motion.p>
      </motion.div>

      <motion.div
        className="space-y-6"
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
            className="w-full text-center text-xl py-6 rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder:text-white/50 focus:border-blue-500 transition-all duration-300 shadow-lg"
            autoFocus
          />
          {name && (
            <motion.div
              className="absolute right-4 top-1/2 transform -translate-y-1/2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
            >
              <span className="text-green-400 text-2xl">✓</span>
            </motion.div>
          )}
        </motion.div>

        {name && (
          <motion.div
            className="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-sm p-4 rounded-2xl border border-green-400/30"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring" }}
          >
            <p className="text-green-300 font-semibold text-center">
              Nice to meet you, {name}! 🎉
            </p>
          </motion.div>
        )}

        <div className="flex flex-col space-y-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleContinue}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-2xl font-semibold text-lg shadow-xl"
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
              className="w-full text-white/70 hover:text-white py-4 rounded-2xl font-medium hover:bg-white/10 text-lg"
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
          className="w-full text-white/60 hover:text-white/80 py-3 rounded-2xl"
        >
          ← Back
        </Button>
      </motion.div>
    </div>
  );
};

export default NameStep;
