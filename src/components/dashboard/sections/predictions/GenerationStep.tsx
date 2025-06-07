
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Scan, Users, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface PredictionData {
  clues: Array<{
    id: string;
    name: string;
    type: 'past-questions' | 'assignment' | 'whisper';
    content?: string;
  }>;
  context: {
    course: string;
    topics: string[];
    lecturer?: string;
  };
  style: 'bullet' | 'theory' | 'mixed';
}

interface GenerationStepProps {
  predictionData: PredictionData;
  onNext: () => void;
  onBack: () => void;
}

export function GenerationStep({ predictionData, onNext, onBack }: GenerationStepProps) {
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);

  const phases = [
    { text: "Looking at your past questions...", icon: Scan, duration: 2000 },
    { text: "Scanning for assignment patterns...", icon: Brain, duration: 2500 },
    { text: "Factoring in what students are saying...", icon: Users, duration: 2000 },
    { text: "Generating predictions...", icon: Brain, duration: 1500 }
  ];

  useEffect(() => {
    let totalTime = 0;
    phases.forEach((phase, index) => {
      setTimeout(() => {
        setCurrentPhase(index);
      }, totalTime);
      totalTime += phase.duration;
    });

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(onNext, 500);
          return 100;
        }
        return prev + 1;
      });
    }, 80);

    return () => {
      clearInterval(progressInterval);
    };
  }, [onNext]);

  const CurrentIcon = phases[currentPhase]?.icon || Brain;

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mb-8">
        <motion.div
          key={currentPhase}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CurrentIcon className="w-10 h-10 text-purple-600" />
        </motion.div>

        <motion.h3
          key={currentPhase}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-bold text-gray-800 mb-2"
        >
          {phases[currentPhase]?.text || "Generating predictions..."}
        </motion.h3>

        <p className="text-gray-600 mb-8">
          Our AI is analyzing your materials to create targeted predictions
        </p>
      </div>

      <div className="mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span>Generating Predictions</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h4 className="font-semibold text-gray-800 mb-4">What CramIntel is analyzing:</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>{predictionData.clues.length} uploaded materials</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Course: {predictionData.context.course}</span>
          </div>
          {predictionData.context.topics.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>{predictionData.context.topics.length} topic filters</span>
            </div>
          )}
          {predictionData.context.lecturer && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>Lecturer behavioral patterns</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack} disabled={progress > 50}>
          Back
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAudioEnabled(!audioEnabled)}
          className="flex items-center gap-2"
        >
          {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          {audioEnabled ? 'Disable' : 'Enable'} Audio
        </Button>
      </div>
    </div>
  );
}
