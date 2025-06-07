
import React from 'react';
import { motion } from 'framer-motion';

const ProfessionalBackground = () => {
  // Generate floating academic elements
  const academicElements = [
    { icon: '🎓', position: { x: 10, y: 20 }, size: 'text-4xl', delay: 0 },
    { icon: '📚', position: { x: 80, y: 15 }, size: 'text-3xl', delay: 1 },
    { icon: '💡', position: { x: 15, y: 70 }, size: 'text-2xl', delay: 2 },
    { icon: '✏️', position: { x: 85, y: 75 }, size: 'text-3xl', delay: 0.5 },
    { icon: '🧠', position: { x: 90, y: 40 }, size: 'text-2xl', delay: 1.5 },
    { icon: '⭐', position: { x: 5, y: 50 }, size: 'text-2xl', delay: 3 },
    { icon: '🚀', position: { x: 75, y: 60 }, size: 'text-3xl', delay: 2.5 },
    { icon: '🎯', position: { x: 20, y: 40 }, size: 'text-2xl', delay: 4 },
    { icon: '⚡', position: { x: 60, y: 25 }, size: 'text-3xl', delay: 1.8 },
    { icon: '📝', position: { x: 40, y: 80 }, size: 'text-2xl', delay: 3.5 }
  ];

  const floatVariants = {
    animate: {
      y: [0, -20, 0],
      rotate: [0, 10, -10, 0],
      scale: [1, 1.1, 1],
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Main gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
      
      {/* Dynamic overlay patterns */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
                        radial-gradient(circle at 80% 70%, rgba(147, 51, 234, 0.3) 0%, transparent 50%),
                        radial-gradient(circle at 60% 20%, rgba(236, 72, 153, 0.2) 0%, transparent 50%)`
          }}
          animate={{
            background: [
              `radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
               radial-gradient(circle at 80% 70%, rgba(147, 51, 234, 0.3) 0%, transparent 50%),
               radial-gradient(circle at 60% 20%, rgba(236, 72, 153, 0.2) 0%, transparent 50%)`,
              `radial-gradient(circle at 40% 60%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
               radial-gradient(circle at 60% 40%, rgba(147, 51, 234, 0.3) 0%, transparent 50%),
               radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.2) 0%, transparent 50%)`,
              `radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
               radial-gradient(circle at 80% 70%, rgba(147, 51, 234, 0.3) 0%, transparent 50%),
               radial-gradient(circle at 60% 20%, rgba(236, 72, 153, 0.2) 0%, transparent 50%)`
            ]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Floating geometric shapes */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 60 + 20}px`,
            height: `${Math.random() * 60 + 20}px`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: Math.random() * 10 + 8,
            delay: Math.random() * 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Academic floating icons */}
      {academicElements.map((element, index) => (
        <motion.div
          key={index}
          className={`absolute ${element.size} opacity-20 filter blur-[0.5px]`}
          style={{
            left: `${element.position.x}%`,
            top: `${element.position.y}%`,
          }}
          variants={floatVariants}
          animate="animate"
          transition={{
            duration: Math.random() * 6 + 8,
            delay: element.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {element.icon}
        </motion.div>
      ))}

      {/* Subtle grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
    </div>
  );
};

export default ProfessionalBackground;
