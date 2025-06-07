
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OnboardingData } from '@/pages/Onboarding';

interface SchoolStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const popularSchools = [
  'University of Lagos (UNILAG)',
  'University of Ibadan (UI)',
  'Ahmadu Bello University (ABU)',
  'University of Nigeria, Nsukka (UNN)',
  'Obafemi Awolowo University (OAU)',
  'Kwame Nkrumah University of Science and Technology (KNUST)',
  'University of Ghana',
  'Covenant University',
  'Babcock University',
  'Landmark University'
];

const SchoolStep = ({ data, updateData, nextStep, prevStep }: SchoolStepProps) => {
  const [selectedSchool, setSelectedSchool] = useState(data.school);
  const [customSchool, setCustomSchool] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleSchoolSelect = (school: string) => {
    setSelectedSchool(school);
    setShowCustomInput(false);
    setCustomSchool('');
  };

  const handleContinue = () => {
    const school = showCustomInput ? customSchool : selectedSchool;
    updateData({ school });
    nextStep();
  };

  const handleCustomSchool = () => {
    setShowCustomInput(true);
    setSelectedSchool('');
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Where do you school? 🎓</h2>
        <p className="text-gray-600">Select your university</p>
      </div>

      {!showCustomInput ? (
        <motion.div
          className="space-y-3 max-h-64 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {popularSchools.map((school, index) => (
            <motion.button
              key={school}
              onClick={() => handleSchoolSelect(school)}
              className={`w-full p-3 text-left rounded-lg border transition-all ${
                selectedSchool === school
                  ? 'border-gray-800 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {school}
              {selectedSchool === school && (
                <motion.span
                  className="float-right text-gray-800"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  ✓
                </motion.span>
              )}
            </motion.button>
          ))}
          
          <Button
            onClick={handleCustomSchool}
            variant="outline"
            className="w-full border-dashed"
          >
            Can't find yours? Add it manually
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <Input
            type="text"
            placeholder="Enter your university name"
            value={customSchool}
            onChange={(e) => setCustomSchool(e.target.value)}
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
          disabled={!selectedSchool && !customSchool.trim()}
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

export default SchoolStep;
