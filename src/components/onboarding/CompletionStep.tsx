
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

const celebrationMessages = [
  "You're absolutely crushing it! 🔥",
  "What a superstar! ⭐",
  "Incredible setup! 🚀",
  "You're going to ace this! 💯",
  "Legend in the making! 👑"
];

const CompletionStep = ({ data, onComplete }: CompletionStepProps) => {
  const [currentTip, setCurrentTip] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [showFireworks, setShowFireworks] = useState(false);

  useEffect(() => {
    setShowFireworks(true);
    
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % studyTips.length);
    }, 2000);

    const messageInterval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % celebrationMessages.length);
    }, 1500);

    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => {
      clearInterval(tipInterval);
      clearInterval(messageInterval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="text-center space-y-6 relative overflow-hidden max-w-2xl mx-auto"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
    >
      {/* Massive confetti explosion */}
      {showFireworks && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'][Math.floor(Math.random() * 7)],
                width: Math.random() * 12 + 4,
                height: Math.random() * 12 + 4,
              }}
              animate={{
                y: [0, -300, 200],
                x: [0, Math.random() * 400 - 200],
                rotate: [0, 720],
                opacity: [1, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 3,
                delay: Math.random() * 0.5,
                repeat: Infinity,
                repeatDelay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}

      {/* Animated celebration emoji */}
      <motion.div
        animate={{ 
          scale: [1, 1.3, 1, 1.2, 1],
          rotate: [0, 10, -10, 5, 0]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="text-8xl mb-4 filter drop-shadow-lg">🎊</div>
      </motion.div>

      <div className="space-y-4 relative z-10">
        <motion.h1
          className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
        >
          Nice one, {data.name}! 🎉
        </motion.h1>
        
        <motion.div
          key={currentMessage}
          className="text-xl font-semibold text-white"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {celebrationMessages[currentMessage]}
        </motion.div>
        
        <motion.p
          className="text-white/70 text-lg"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Your dashboard is loading...
        </motion.p>
        
        <motion.p
          className="text-white font-bold text-xl"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          Time to cut the noise and learn what counts.
        </motion.p>
      </div>

      <motion.div
        className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm p-6 rounded-2xl border border-white/20 relative overflow-hidden"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, type: "spring" }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10"
          animate={{ x: [-100, 100] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        <motion.p
          key={currentTip}
          className="text-white/90 font-medium relative z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
        >
          💡 Study Tip: {studyTips[currentTip]}
        </motion.p>
      </motion.div>

      {/* Loading animation */}
      <motion.div
        className="flex justify-center space-x-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1,
              delay: i * 0.15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </motion.div>

      {/* Success badge */}
      <motion.div
        className="absolute top-0 right-0 bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-2 rounded-bl-2xl font-bold"
        initial={{ x: 100, y: -100 }}
        animate={{ x: 0, y: 0 }}
        transition={{ delay: 2, type: "spring", bounce: 0.6 }}
      >
        Setup Complete! ✅
      </motion.div>
    </motion.div>
  );
};

export default CompletionStep;
