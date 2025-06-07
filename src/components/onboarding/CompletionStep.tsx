
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { OnboardingData } from '@/pages/Onboarding';

interface CompletionStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  onComplete: () => void;
}

const studyTips = [
  "📚 Break down complex topics into smaller chunks",
  "🧠 Use active recall instead of just re-reading",
  "⏰ The Pomodoro Technique: 25 min study, 5 min break",
  "🔄 Spaced repetition helps with long-term retention",
  "💡 Teach someone else to test your understanding"
];

const CompletionStep = ({ data, onComplete }: CompletionStepProps) => {
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % studyTips.length);
    }, 2000);

    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="text-center space-y-6"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Confetti animation */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-yellow-400 rounded"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 100],
              x: [0, Math.random() * 50 - 25],
              rotate: [0, 360],
              opacity: [1, 0],
            }}
            transition={{
              duration: 3,
              delay: Math.random() * 0.5,
              repeat: Infinity,
            }}
          />
        ))}
      </motion.div>

      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <div className="text-6xl mb-4">🎊</div>
      </motion.div>

      <div className="space-y-4">
        <motion.h1
          className="text-2xl font-bold text-gray-900"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Nice one, {data.name}! 🎉
        </motion.h1>
        
        <motion.p
          className="text-gray-600 text-lg"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Your dashboard is loading...
        </motion.p>
        
        <motion.p
          className="text-gray-800 font-medium"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          Time to cut the noise and learn what counts.
        </motion.p>
      </div>

      <motion.div
        className="bg-gray-50 p-4 rounded-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <motion.p
          key={currentTip}
          className="text-sm text-gray-600"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
        >
          💡 Study Tip: {studyTips[currentTip]}
        </motion.p>
      </motion.div>

      <motion.div
        className="flex justify-center space-x-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{
              duration: 1,
              delay: i * 0.2,
              repeat: Infinity,
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};

export default CompletionStep;
