
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
          Where do you school? 🎓
        </motion.h2>
        <motion.p 
          className="text-white/70 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Select your university
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
            className="space-y-3 max-h-64 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            {popularSchools.map((school, index) => (
              <motion.button
                key={school}
                onClick={() => handleSchoolSelect(school)}
                className={`w-full p-3 text-left rounded-xl border-2 transition-all ${
                  selectedSchool === school
                    ? 'border-blue-500 bg-blue-500/20 backdrop-blur-sm'
                    : 'border-white/20 bg-white/10 backdrop-blur-sm hover:border-white/40'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-white text-sm">{school}</span>
                {selectedSchool === school && (
                  <motion.span
                    className="float-right text-blue-400"
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
              className="w-full border-2 border-dashed border-white/30 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white"
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
              disabled={!selectedSchool && !customSchool.trim()}
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

export default SchoolStep;
