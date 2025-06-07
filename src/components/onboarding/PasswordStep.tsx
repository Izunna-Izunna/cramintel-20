
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { OnboardingData } from '@/pages/Onboarding';

interface PasswordStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const PasswordStep = ({ data, updateData, nextStep, prevStep }: PasswordStepProps) => {
  const [password, setPassword] = useState(data.password);
  const [showPassword, setShowPassword] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const validatePassword = (password: string) => {
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /[0-9]/.test(password);
  };

  const getPasswordStrength = (password: string) => {
    if (password.length < 6) return { strength: 'weak', color: 'red', text: 'Too short' };
    if (password.length < 8) return { strength: 'fair', color: 'orange', text: 'Getting there' };
    if (!validatePassword(password)) return { strength: 'good', color: 'yellow', text: 'Almost there' };
    return { strength: 'strong', color: 'green', text: 'Strong password!' };
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    const valid = validatePassword(newPassword);
    setIsValid(valid);
    
    if (valid && !showCelebration) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 1000);
    }
  };

  const handleContinue = () => {
    updateData({ password });
    setShowCelebration(true);
    setTimeout(() => nextStep(), 800);
  };

  const passwordStrength = getPasswordStrength(password);

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
              className="absolute w-3 h-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
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
          className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Lock className="w-8 h-8 text-white" />
        </motion.div>
        
        <motion.h2 
          className="text-3xl font-bold text-gray-900"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Create a password
        </motion.h2>
        <motion.p 
          className="text-gray-600 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Keep your account secure
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
            type={showPassword ? "text" : "password"}
            placeholder="Create a strong password"
            value={password}
            onChange={handlePasswordChange}
            className="w-full text-center text-xl py-4 pr-12 rounded-xl border-2 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </motion.div>

        {password && (
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Password strength:</span>
              <span className={`font-medium text-${passwordStrength.color}-600`}>
                {passwordStrength.text}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className={`h-2 rounded-full bg-${passwordStrength.color}-500`}
                initial={{ width: 0 }}
                animate={{ 
                  width: passwordStrength.strength === 'weak' ? '25%' :
                         passwordStrength.strength === 'fair' ? '50%' :
                         passwordStrength.strength === 'good' ? '75%' : '100%'
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}

        <motion.div
          className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-gray-600 mb-2">Password must contain:</p>
          <ul className="space-y-1 text-xs">
            <li className={`flex items-center gap-2 ${password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
              <span>{password.length >= 8 ? '✓' : '○'}</span>
              At least 8 characters
            </li>
            <li className={`flex items-center gap-2 ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
              <span>{/[A-Z]/.test(password) ? '✓' : '○'}</span>
              One uppercase letter
            </li>
            <li className={`flex items-center gap-2 ${/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
              <span>{/[a-z]/.test(password) ? '✓' : '○'}</span>
              One lowercase letter
            </li>
            <li className={`flex items-center gap-2 ${/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
              <span>{/[0-9]/.test(password) ? '✓' : '○'}</span>
              One number
            </li>
          </ul>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Button
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-3 rounded-xl font-semibold"
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
          🔐
        </motion.div>
        <motion.div
          className="absolute bottom-5 left-5 text-2xl opacity-30"
          animate={{ y: [-5, 5, -5] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          🛡️
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PasswordStep;
