
import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';

interface ProgressStepsProps {
  currentStep: number;
  steps: string[];
}

export function ProgressSteps({ currentStep, steps }: ProgressStepsProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <div className="flex items-center">
            {index < currentStep ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : index === currentStep ? (
              <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-white" />
              </div>
            ) : (
              <Circle className="w-6 h-6 text-gray-300" />
            )}
            <span className={`ml-2 text-sm ${
              index <= currentStep ? 'text-gray-800 font-medium' : 'text-gray-400'
            }`}>
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`ml-4 w-8 h-0.5 ${
              index < currentStep ? 'bg-green-500' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}
