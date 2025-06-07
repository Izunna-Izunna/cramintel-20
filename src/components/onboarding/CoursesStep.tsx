
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
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">What courses are you taking? 📚</h2>
        <p className="text-gray-600">Add the subjects you're currently studying</p>
      </div>

      <div className="space-y-4">
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="e.g., CSC204, ENG301, GST101"
            value={newCourse}
            onChange={(e) => setNewCourse(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button
            onClick={addCourse}
            disabled={!newCourse.trim()}
            className="bg-gray-800 hover:bg-gray-700"
          >
            Add
          </Button>
        </div>

        {selectedCourses.length > 0 && (
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-sm text-gray-600">Selected courses:</div>
            <div className="flex flex-wrap gap-2">
              {selectedCourses.map((course, index) => (
                <motion.div
                  key={course}
                  className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <span className="text-sm">{course}</span>
                  <button
                    onClick={() => removeCourse(course)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </div>
            
            <motion.div
              className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              🎯 We'll help you prep smarter for: {selectedCourses.join(', ')}
            </motion.div>
          </motion.div>
        )}
      </div>

      <div className="flex flex-col space-y-3">
        <Button
          onClick={handleContinue}
          className="w-full bg-gray-800 hover:bg-gray-700 text-white"
          disabled={selectedCourses.length === 0}
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

export default CoursesStep;
