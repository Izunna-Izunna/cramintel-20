
import React from 'react';
import { motion } from 'framer-motion';

interface StepWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const StepWrapper = ({ children, className = '' }: StepWrapperProps) => {
  return (
    <motion.div
      className={`bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-8 ${className}`}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Decorative elements */}
      <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full opacity-60" />
      <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-60" />
    </motion.div>
  );
};

export default StepWrapper;
