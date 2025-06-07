
import React from 'react';
import { motion } from 'framer-motion';

interface ParticleCelebrationProps {
  trigger: boolean;
  onComplete?: () => void;
}

const ParticleCelebration = ({ trigger, onComplete }: ParticleCelebrationProps) => {
  if (!trigger) return null;

  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    color: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][Math.floor(Math.random() * 5)],
    size: Math.random() * 8 + 4,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            backgroundColor: particle.color,
            width: particle.size,
            height: particle.size,
            left: particle.x,
            top: particle.y,
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{
            scale: [0, 1, 0],
            opacity: [1, 1, 0],
            y: [0, -200],
            x: [0, Math.random() * 200 - 100],
            rotate: [0, 360],
          }}
          transition={{
            duration: 2,
            ease: "easeOut",
          }}
          onAnimationComplete={() => {
            if (particle.id === 0 && onComplete) {
              onComplete();
            }
          }}
        />
      ))}
    </div>
  );
};

export default ParticleCelebration;
