
import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StartPredictionStepProps {
  onNext: () => void;
}

export function StartPredictionStep({ onNext }: StartPredictionStepProps) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Brain className="w-12 h-12 text-purple-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-4">
          Let's help you guess smarter
        </h3>
        <p className="text-lg text-gray-600 mb-8">
          Upload anything that might help us predict what's coming in your exam. 
          The more context you provide, the better our AI predictions will be.
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
      >
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-2xl mb-2">📄</div>
          <h4 className="font-semibold text-gray-800 mb-1">Past Questions</h4>
          <p className="text-sm text-gray-600">Previous exams, test scripts, sample questions</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-2xl mb-2">📝</div>
          <h4 className="font-semibold text-gray-800 mb-1">Assignments</h4>
          <p className="text-sm text-gray-600">Coursework, projects, lab reports</p>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="text-2xl mb-2">🤫</div>
          <h4 className="font-semibold text-gray-800 mb-1">Class Whispers</h4>
          <p className="text-sm text-gray-600">Lecturer hints, study group discussions</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Button onClick={onNext} size="lg" className="bg-purple-600 hover:bg-purple-700">
          <Sparkles className="w-5 h-5 mr-2" />
          Start Prediction Journey
        </Button>
      </motion.div>
    </div>
  );
}
