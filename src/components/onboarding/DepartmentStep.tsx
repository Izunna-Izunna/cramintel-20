
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OnboardingData } from '@/pages/Onboarding';

interface DepartmentStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const departments = [
  'Computer Science',
  'Engineering',
  'Medicine',
  'Law',
  'Business Administration',
  'Economics',
  'Biology',
  'Chemistry',
  'Physics',
  'Mathematics',
  'English',
  'Psychology',
  'Political Science',
  'Mass Communication',
  'Accounting',
  'Architecture'
];

const DepartmentStep = ({ data, updateData, nextStep, prevStep }: DepartmentStepProps) => {
  const [selectedDepartment, setSelectedDepartment] = useState(data.department);
  const [customDepartment, setCustomDepartment] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [typingText, setTypingText] = useState('');

  React.useEffect(() => {
    const texts = [
      "Engineering students be like: sleep, eat, cram, repeat 💡",
      "Med students: 'I'll just review this 500-page textbook' 📚",
      "Law students mastering the art of case briefs ⚖️",
      "Computer Science: where coffee becomes code ☕"
    ];
    
    let textIndex = 0;
    let charIndex = 0;
    
    const typeText = () => {
      if (charIndex < texts[textIndex].length) {
        setTypingText(texts[textIndex].substring(0, charIndex + 1));
        charIndex++;
        setTimeout(typeText, 50);
      } else {
        setTimeout(() => {
          textIndex = (textIndex + 1) % texts.length;
          charIndex = 0;
          setTypingText('');
          setTimeout(typeText, 500);
        }, 2000);
      }
    };
    
    typeText();
  }, []);

  const handleDepartmentSelect = (department: string) => {
    setSelectedDepartment(department);
    setShowCustomInput(false);
    setCustomDepartment('');
  };

  const handleContinue = () => {
    const department = showCustomInput ? customDepartment : selectedDepartment;
    updateData({ department });
    nextStep();
  };

  return (
    <div className="space-y-8 relative max-w-lg mx-auto">
      <motion.div 
        className="text-center space-y-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
      >
        <motion.h2 
          className="text-3xl font-bold text-white"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          What department are you in? 🏫
        </motion.h2>
        <motion.p
          className="text-white/70 text-lg h-6"
          key={typingText}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {typingText}
        </motion.p>
      </motion.div>

      <motion.div
        className="space-y-6"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {!showCustomInput ? (
          <motion.div
            className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            {departments.map((department, index) => (
              <motion.button
                key={department}
                onClick={() => handleDepartmentSelect(department)}
                className={`p-3 text-sm rounded-xl border-2 transition-all ${
                  selectedDepartment === department
                    ? 'border-blue-500 bg-blue-500/20 backdrop-blur-sm'
                    : 'border-white/20 bg-white/10 backdrop-blur-sm hover:border-white/40'
                }`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-white">{department}</span>
                {selectedDepartment === department && (
                  <div className="text-blue-400 mt-1">✓</div>
                )}
              </motion.button>
            ))}
            
            <button
              onClick={() => setShowCustomInput(true)}
              className="col-span-2 p-3 border-2 border-dashed border-white/30 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-white/80 hover:text-white"
            >
              Other Department
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <Input
              type="text"
              placeholder="Enter your department"
              value={customDepartment}
              onChange={(e) => setCustomDepartment(e.target.value)}
              className="w-full text-center text-lg py-4 rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder:text-white/50 focus:border-blue-500 transition-all duration-300 shadow-lg"
              autoFocus
            />
            <Button
              onClick={() => setShowCustomInput(false)}
              variant="ghost"
              className="w-full text-white/60 hover:text-white/80"
            >
              ← Back to list
            </Button>
          </motion.div>
        )}

        <div className="flex flex-col space-y-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleContinue}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-2xl font-semibold text-lg shadow-xl"
              disabled={!selectedDepartment && !customDepartment.trim()}
            >
              Continue
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={prevStep}
          variant="ghost"
          className="w-full text-white/60 hover:text-white/80 py-3 rounded-2xl"
        >
          ← Back
        </Button>
      </motion.div>
    </div>
  );
};

export default DepartmentStep;
