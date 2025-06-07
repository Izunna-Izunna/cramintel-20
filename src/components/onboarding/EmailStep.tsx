
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail } from 'lucide-react';
import { OnboardingData } from '@/pages/Onboarding';

interface EmailStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const EmailStep = ({ data, updateData, nextStep, prevStep }: EmailStepProps) => {
  const [email, setEmail] = useState(data.email);
  const [isValid, setIsValid] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    const valid = validateEmail(newEmail);
    setIsValid(valid);
    
    if (valid && !showCelebration) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 1000);
    }
  };

  const handleContinue = () => {
    updateData({ email: email.trim() });
    setShowCelebration(true);
    setTimeout(() => nextStep(), 800);
  };

  return (
    <motion.div
      className="space-y-6 relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: "spring" }}
    >
      {/* Celebration particles */}
      {showCelebration && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [1, 1, 0],
                y: [-20, -100],
              }}
              transition={{ duration: 1.5 }}
            />
          ))}
        </div>
      )}

      <motion.div 
        className="text-center space-y-3"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div
          className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Mail className="w-8 h-8 text-white" />
        </motion.div>
        
        <motion.h2 
          className="text-3xl font-bold text-gray-900"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          What's your email?
        </motion.h2>
        <motion.p 
          className="text-gray-600 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          We'll use this to keep your progress safe
        </motion.p>
      </motion.div>

      <motion.div
        className="space-y-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <motion.div 
          className="relative"
          whileFocus={{ scale: 1.02 }}
        >
          <Input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={handleEmailChange}
            className="w-full text-center text-xl py-4 rounded-xl border-2 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
            autoFocus
          />
          {isValid && (
            <motion.div
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
            >
              <span className="text-green-500 text-xl">✓</span>
            </motion.div>
          )}
        </motion.div>

        {!isValid && email && (
          <motion.div
            className="bg-red-50 p-3 rounded-xl border border-red-200"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-red-600 text-sm">
              Please enter a valid email address
            </p>
          </motion.div>
        )}

        {isValid && (
          <motion.div
            className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-xl border border-blue-200"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring" }}
          >
            <p className="text-blue-700 font-medium">
              Perfect! Your email looks good 📧
            </p>
          </motion.div>
        )}

        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Button
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold"
            disabled={!isValid}
          >
            Continue
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={prevStep}
          variant="ghost"
          className="w-full text-gray-500 hover:text-gray-700 py-2 rounded-xl"
        >
          ← Back
        </Button>
      </motion.div>

      {/* Background decorative elements */}
      <div className="absolute -z-10 inset-0 overflow-hidden">
        <motion.div
          className="absolute top-5 right-5 text-3xl opacity-30"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          📧
        </motion.div>
        <motion.div
          className="absolute bottom-5 left-5 text-2xl opacity-30"
          animate={{ y: [-5, 5, -5] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          🔒
        </motion.div>
      </div>
    </motion.div>
  );
};

export default EmailStep;
