
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import WelcomeStep from '@/components/onboarding/WelcomeStep';
import NameStep from '@/components/onboarding/NameStep';
import SchoolStep from '@/components/onboarding/SchoolStep';
import DepartmentStep from '@/components/onboarding/DepartmentStep';
import CoursesStep from '@/components/onboarding/CoursesStep';
import StudyStyleStep from '@/components/onboarding/StudyStyleStep';
import FirstActionStep from '@/components/onboarding/FirstActionStep';
import CompletionStep from '@/components/onboarding/CompletionStep';
import ProgressBar from '@/components/onboarding/ProgressBar';
import AnimatedBackground from '@/components/onboarding/AnimatedBackground';
import EncouragingMessage from '@/components/onboarding/EncouragingMessage';
import ParticleCelebration from '@/components/onboarding/ParticleCelebration';

export interface OnboardingData {
  name: string;
  school: string;
  department: string;
  courses: string[];
  studyStyle: string;
  firstAction: string;
}

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    school: '',
    department: '',
    courses: [],
    studyStyle: '',
    firstAction: ''
  });
  const [showCelebration, setShowCelebration] = useState(false);
  const navigate = useNavigate();

  const totalSteps = 8;

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem('onboardingProgress', JSON.stringify({ currentStep, data }));
  }, [currentStep, data]);

  // Load progress from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('onboardingProgress');
    if (saved) {
      const { currentStep: savedStep, data: savedData } = JSON.parse(saved);
      setCurrentStep(savedStep);
      setData(savedData);
    }
  }, []);

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setShowCelebration(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setShowCelebration(false);
      }, 1000);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const completeOnboarding = () => {
    localStorage.setItem('cramIntelUser', JSON.stringify(data));
    localStorage.removeItem('onboardingProgress');
    setTimeout(() => {
      navigate('/dashboard');
    }, 3000);
  };

  const stepVariants = {
    enter: { 
      opacity: 0, 
      x: 100,
      scale: 0.9
    },
    center: { 
      opacity: 1, 
      x: 0,
      scale: 1
    },
    exit: { 
      opacity: 0, 
      x: -100,
      scale: 0.9
    }
  };

  const renderStep = () => {
    const stepProps = {
      data,
      updateData,
      nextStep,
      prevStep
    };

    switch (currentStep) {
      case 1:
        return <WelcomeStep {...stepProps} />;
      case 2:
        return <NameStep {...stepProps} />;
      case 3:
        return <SchoolStep {...stepProps} />;
      case 4:
        return <DepartmentStep {...stepProps} />;
      case 5:
        return <CoursesStep {...stepProps} />;
      case 6:
        return <StudyStyleStep {...stepProps} />;
      case 7:
        return <FirstActionStep {...stepProps} />;
      case 8:
        return <CompletionStep {...stepProps} onComplete={completeOnboarding} />;
      default:
        return <WelcomeStep {...stepProps} />;
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden">
      <AnimatedBackground />
      
      {currentStep > 1 && currentStep < totalSteps && <EncouragingMessage />}
      
      <ParticleCelebration 
        trigger={showCelebration} 
        onComplete={() => setShowCelebration(false)} 
      />

      {currentStep < totalSteps && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, type: "spring" }}
        >
          <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
        </motion.div>
      )}
      
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ 
                duration: 0.4, 
                ease: "easeInOut",
                type: "spring",
                bounce: 0.3
              }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
