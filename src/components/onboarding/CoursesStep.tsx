
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { OnboardingData } from '@/pages/Onboarding';

interface CoursesStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const CoursesStep = ({ data, updateData, nextStep, prevStep }: CoursesStepProps) => {
  const [selectedCourses, setSelectedCourses] = useState<string[]>(data.courses);
  const [newCourse, setNewCourse] = useState('');

  const addCourse = () => {
    if (newCourse.trim() && !selectedCourses.includes(newCourse.trim())) {
      const updated = [...selectedCourses, newCourse.trim()];
      setSelectedCourses(updated);
      setNewCourse('');
    }
  };

  const removeCourse = (course: string) => {
    setSelectedCourses(selectedCourses.filter(c => c !== course));
  };

  const handleContinue = () => {
    updateData({ courses: selectedCourses });
    nextStep();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addCourse();
    }
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
          What courses are you taking? 📚
        </motion.h2>
        <motion.p 
          className="text-white/70 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Add the subjects you're currently studying
        </motion.p>
      </motion.div>

      <motion.div
        className="space-y-6"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="e.g., CSC204, ENG301, GST101"
            value={newCourse}
            onChange={(e) => setNewCourse(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 text-lg py-4 rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder:text-white/50 focus:border-blue-500 transition-all duration-300 shadow-lg"
          />
          <Button
            onClick={addCourse}
            disabled={!newCourse.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 rounded-2xl"
          >
            Add
          </Button>
        </div>

        {selectedCourses.length > 0 && (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-sm text-white/70">Selected courses:</div>
            <div className="flex flex-wrap gap-2">
              {selectedCourses.map((course, index) => (
                <motion.div
                  key={course}
                  className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-2 border border-white/20"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <span className="text-sm text-white">{course}</span>
                  <button
                    onClick={() => removeCourse(course)}
                    className="text-white/60 hover:text-white/80"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </div>
            
            <motion.div
              className="text-sm text-white/80 bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              🎯 We'll help you prep smarter for: {selectedCourses.join(', ')}
            </motion.div>
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
              disabled={selectedCourses.length === 0}
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

export default CoursesStep;
