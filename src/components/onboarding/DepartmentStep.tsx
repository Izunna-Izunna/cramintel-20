
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
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">What department are you in? 🏫</h2>
        <motion.p
          className="text-gray-600 h-6"
          key={typingText}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {typingText}
        </motion.p>
      </div>

      {!showCustomInput ? (
        <motion.div
          className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {departments.map((department, index) => (
            <motion.button
              key={department}
              onClick={() => handleDepartmentSelect(department)}
              className={`p-3 text-sm rounded-lg border transition-all ${
                selectedDepartment === department
                  ? 'border-gray-800 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.03 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {department}
              {selectedDepartment === department && (
                <div className="text-gray-800 mt-1">✓</div>
              )}
            </motion.button>
          ))}
          
          <button
            onClick={() => setShowCustomInput(true)}
            className="col-span-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
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
            className="w-full"
            autoFocus
          />
          <Button
            onClick={() => setShowCustomInput(false)}
            variant="ghost"
            className="w-full"
          >
            ← Back to list
          </Button>
        </motion.div>
      )}

      <div className="flex flex-col space-y-3">
        <Button
          onClick={handleContinue}
          className="w-full bg-gray-800 hover:bg-gray-700 text-white"
          disabled={!selectedDepartment && !customDepartment.trim()}
        >
          Continue
        </Button>
        
        <Button
          onClick={prevStep}
          variant="ghost"
          className="w-full text-gray-500 hover:text-gray-700"
        >
          ← Back
        </Button>
      </div>
    </motion.div>
  );
};

export default DepartmentStep;
