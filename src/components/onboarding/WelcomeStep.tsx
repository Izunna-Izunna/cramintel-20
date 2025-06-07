
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { OnboardingData } from '@/pages/Onboarding';
import StepWrapper from './StepWrapper';

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
    <StepWrapper className="text-center space-y-8 relative overflow-hidden">
      {/* Premium confetti animation */}
      {confetti && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][Math.floor(Math.random() * 5)],
              }}
              animate={{
                y: [-50, 50, -50],
                x: [0, Math.random() * 60 - 30],
                rotate: [0, 360],
                opacity: [1, 0.5, 1],
                scale: [0.5, 1.2, 0.5],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )}

      {/* Hero graduation cap with enhanced animation */}
      <motion.div
        animate={{ 
          y: [0, -20, 0],
          rotate: [0, 10, -10, 0],
          scale: [1, 1.15, 1]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="relative"
      >
        <div className="text-8xl mb-6 filter drop-shadow-2xl">🎓</div>
        {/* Glowing effect */}
        <div className="absolute inset-0 text-8xl mb-6 filter blur-xl opacity-30">🎓</div>
      </motion.div>
      
      {/* Dynamic text content */}
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: showText ? 1 : 0, y: showText ? 0 : 30 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <motion.h1 
          className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight"
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          Welcome to CramIntel
        </motion.h1>
        
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p className="text-gray-700 text-xl font-semibold">
            Your AI-powered study companion 🚀
          </p>
          
          <p className="text-gray-600 text-lg">
            Get ready for a personalized learning experience
          </p>
        </motion.div>

        {/* Feature highlights */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
        >
          {[
            { icon: '🧠', text: 'Smart Predictions' },
            { icon: '⚡', text: 'Fast Learning' },
            { icon: '🎯', text: 'Targeted Practice' }
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200"
              whileHover={{ scale: 1.05, y: -2 }}
              transition={{ type: "spring", bounce: 0.4 }}
            >
              <div className="text-2xl mb-2">{feature.icon}</div>
              <div className="text-sm font-medium text-gray-700">{feature.text}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Engagement message */}
        <motion.div
          className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 p-6 rounded-2xl border-2 border-blue-200 relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2, type: "spring" }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-purple-100/50"
            animate={{ x: [-100, 100] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
          <motion.p 
            className="text-gray-800 font-bold text-lg relative z-10"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 2.5 }}
          >
            🎉 Ready to transform your study game?
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Enhanced CTA button */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.5, type: "spring", bounce: 0.6 }}
      >
        <Button
          onClick={handleNext}
          className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white py-6 text-xl font-bold rounded-2xl shadow-2xl border-0 relative overflow-hidden group"
        >
          <motion.span
            className="relative z-10 flex items-center justify-center gap-2"
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Let's Get Started! ✨
          </motion.span>
          
          {/* Button glow effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
            animate={{ x: [-100, 100] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </Button>
      </motion.div>

      {/* Floating background elements */}
      <div className="absolute -z-10 inset-0 overflow-hidden">
        {['📚', '💡', '⭐', '🚀'].map((icon, index) => (
          <motion.div
            key={index}
            className={`absolute text-3xl opacity-20`}
            style={{
              left: `${[15, 85, 10, 90][index]}%`,
              top: `${[20, 25, 80, 75][index]}%`,
            }}
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1],
              y: [-10, 10, -10],
            }}
            transition={{
              duration: Math.random() * 8 + 6,
              repeat: Infinity,
              delay: index * 0.5,
            }}
          >
            {icon}
          </motion.div>
        ))}
      </div>
    </StepWrapper>
  );
};

export default WelcomeStep;
