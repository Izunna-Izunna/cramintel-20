
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const encouragingMessages = [
  "You're crushing it! 🔥",
  "Almost there, genius! 🧠",
  "Looking good! ✨",
  "You've got this! 💪",
  "Fantastic progress! 🎯",
  "Keep going, superstar! ⭐",
  "You're on fire! 🚀",
  "Brilliant choices! 💡",
  "Way to go! 🎉",
  "Unstoppable! ⚡"
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
    <div className="fixed top-20 right-6 z-20 pointer-events-none">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg"
            initial={{ opacity: 0, scale: 0.8, x: 100 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 100 }}
            transition={{ type: "spring", bounce: 0.5 }}
          >
            <motion.span
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
            >
              {encouragingMessages[currentMessage]}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EncouragingMessage;
