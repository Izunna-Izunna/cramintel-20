
import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressBar = ({ currentStep, totalSteps }: ProgressBarProps) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full bg-black/50 backdrop-blur-sm border-b border-white/10 shadow-xl">
      <div className="max-w-md mx-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <motion.span 
            className="text-sm text-white/80 font-medium"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            Step {currentStep} of {totalSteps}
          </motion.span>
          <motion.span 
            className="text-sm text-white/80 font-medium"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {Math.round(progress)}% Complete
          </motion.span>
        </div>
        
        <div className="relative">
          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden backdrop-blur-sm">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full relative overflow-hidden"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {/* Animated shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{
                  x: ['-100%', '100%']
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </motion.div>
          </div>
          
          {/* Progress dots */}
          <div className="absolute top-1/2 transform -translate-y-1/2 w-full flex justify-between px-1">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <motion.div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index < currentStep 
                    ? 'bg-white shadow-lg' 
                    : index === currentStep - 1
                    ? 'bg-gradient-to-r from-blue-400 to-purple-400 shadow-lg'
                    : 'bg-white/30'
                }`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.1,
                  type: "spring",
                  bounce: 0.5
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Motivational text */}
        <motion.div
          className="mt-4 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-xs text-white/60">
            {currentStep === 1 && "Let's get started! 🚀"}
            {currentStep === 2 && "Tell us about yourself 👋"}
            {currentStep === 3 && "Almost there! 💪"}
            {currentStep >= 4 && currentStep <= 7 && "You're doing great! ⭐"}
            {currentStep >= 8 && currentStep < totalSteps && "Final stretch! 🎯"}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ProgressBar;
