
import React from 'react';
import { motion } from 'framer-motion';

const AnimatedBackground = () => {
  // Generate random positions for floating elements
  const floatingElements = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 20 + 10,
    delay: Math.random() * 5,
    duration: Math.random() * 10 + 10,
  }));

  const academicIcons = ['📚', '💡', '🎓', '✏️', '📝', '🧠', '⚡', '🎯', '🚀', '⭐'];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"
        animate={{
          background: [
            'linear-gradient(45deg, #f8fafc, #f1f5f9, #e2e8f0)',
            'linear-gradient(45deg, #fef7ff, #f3e8ff, #e9d5ff)',
            'linear-gradient(45deg, #fff7ed, #fed7aa, #fdba74)',
            'linear-gradient(45deg, #f0fdf4, #dcfce7, #bbf7d0)',
            'linear-gradient(45deg, #f8fafc, #f1f5f9, #e2e8f0)',
          ]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      {/* Floating geometric shapes */}
      {floatingElements.map((element) => (
        <motion.div
          key={element.id}
          className="absolute rounded-full bg-gradient-to-r from-blue-200/30 to-purple-200/30"
          style={{
            left: `${element.x}%`,
            top: `${element.y}%`,
            width: `${element.size}px`,
            height: `${element.size}px`,
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: element.duration,
            delay: element.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Floating academic icons */}
      {academicIcons.map((icon, index) => (
        <motion.div
          key={index}
          className="absolute text-2xl"
          style={{
            left: `${Math.random() * 90 + 5}%`,
            top: `${Math.random() * 90 + 5}%`,
          }}
          animate={{
            y: [-30, 30, -30],
            rotate: [-15, 15, -15],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: Math.random() * 8 + 6,
            delay: Math.random() * 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {icon}
        </motion.div>
      ))}

      {/* Animated waves */}
      <svg
        className="absolute bottom-0 left-0 w-full h-32"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z"
          fill="url(#wave-gradient)"
          animate={{
            d: [
              "M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z",
              "M0,80 C300,0 900,120 1200,80 L1200,120 L0,120 Z",
              "M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z",
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <defs>
          <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default AnimatedBackground;
