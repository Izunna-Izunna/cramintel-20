
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const encouragingMessages = [
  "You're absolutely crushing it! 🔥",
  "Looking fantastic so far! ✨",
  "What a superstar! ⭐",
  "You've got this! 💪",
  "Incredible progress! 🚀",
  "Keep up the amazing work! 🎯",
  "You're on fire! ⚡",
  "Brilliant choices! 💡",
  "Outstanding! 🌟",
  "Unstoppable energy! 💫"
];

const EncouragingMessage = () => {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentMessage((prev) => (prev + 1) % encouragingMessages.length);
        setIsVisible(true);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-24 right-6 z-20 pointer-events-none">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-sm border border-white/20"
            initial={{ opacity: 0, scale: 0.8, x: 100, y: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 100, y: -20 }}
            transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
          >
            <motion.span
              className="font-semibold text-sm"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2 }}
            >
              {encouragingMessages[currentMessage]}
            </motion.span>
            
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur-xl opacity-30 -z-10" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EncouragingMessage;
