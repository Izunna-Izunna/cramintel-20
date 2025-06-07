
import React, { useState, useEffect } from 'react';
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
  const [showText, setShowText] = useState(false);
  const [confetti, setConfetti] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowText(true), 800);
    setTimeout(() => setConfetti(true), 1200);
  }, []);

  const handleNext = () => {
    setConfetti(true);
    setTimeout(() => nextStep(), 500);
  };

  return (
    <motion.div
      className="text-center space-y-6 relative"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
    >
      {/* Floating confetti */}
      {confetti && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [-50, 50, -50],
                x: [0, Math.random() * 30 - 15],
                rotate: [0, 360],
                opacity: [1, 0.5, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}

      <motion.div
        animate={{ 
          y: [0, -15, 0],
          rotate: [0, 5, -5, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        <div className="text-8xl mb-4 filter drop-shadow-lg">🎓</div>
      </motion.div>
      
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: showText ? 1 : 0, y: showText ? 0 : 20 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <motion.h1 
          className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Hey there 👋 Welcome to CramIntel
        </motion.h1>
        
        <motion.p 
          className="text-gray-700 text-xl font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Your new exam prep sidekick
        </motion.p>
        
        <motion.p 
          className="text-gray-600 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          We'll get you set up in less than 60 seconds.
        </motion.p>

        <motion.div
          className="bg-gradient-to-r from-yellow-100 to-orange-100 p-4 rounded-xl border-2 border-yellow-200"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5, type: "spring" }}
        >
          <motion.p 
            className="text-gray-700 font-medium"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 2 }}
          >
            🚀 Ready to ace your exams like never before?
          </motion.p>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, type: "spring", bounce: 0.6 }}
        whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={handleNext}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 text-xl font-bold rounded-xl shadow-xl"
        >
          <motion.span
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            Let's Go! 🚀
          </motion.span>
        </Button>
      </motion.div>

      {/* Background elements */}
      <div className="absolute -z-10 inset-0">
        <motion.div
          className="absolute top-10 left-10 text-4xl opacity-20"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          📚
        </motion.div>
        <motion.div
          className="absolute bottom-10 right-10 text-3xl opacity-20"
          animate={{ y: [-10, 10, -10], rotate: [-10, 10, -10] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          💡
        </motion.div>
        <motion.div
          className="absolute top-20 right-20 text-2xl opacity-20"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          ⭐
        </motion.div>
      </div>
    </motion.div>
  );
};

export default WelcomeStep;
