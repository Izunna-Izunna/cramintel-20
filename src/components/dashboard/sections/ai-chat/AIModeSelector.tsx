
import React from 'react';
import { Button } from '@/components/ui/button';
import { BookOpen, MessageSquare, Brain, FileQuestion, Target, Lightbulb } from 'lucide-react';

export type AIMode = 'tutor' | 'explain' | 'quiz' | 'summarize' | 'analyze' | 'practice';

interface AIModeProps {
  selectedMode: AIMode;
  onModeChange: (mode: AIMode) => void;
}

const modes = [
  {
    id: 'tutor' as AIMode,
    name: 'Tutor',
    icon: BookOpen,
    description: 'Step-by-step guidance and progressive learning'
  },
  {
    id: 'explain' as AIMode,
    name: 'Explain',
    icon: Lightbulb,
    description: 'Deep explanations with examples and context'
  },
  {
    id: 'quiz' as AIMode,
    name: 'Quiz',
    icon: Target,
    description: 'Interactive testing and instant feedback'
  },
  {
    id: 'summarize' as AIMode,
    name: 'Summarize',
    icon: FileQuestion,
    description: 'Extract key points and organize information'
  },
  {
    id: 'analyze' as AIMode,
    name: 'Analyze',
    icon: Brain,
    description: 'Critical analysis and pattern recognition'
  },
  {
    id: 'practice' as AIMode,
    name: 'Practice',
    icon: MessageSquare,
    description: 'Practice problems and exam preparation'
  }
];

export function AIModeSelector({ selectedMode, onModeChange }: AIModeProps) {
  return (
    <div className="border-b border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Mode</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;
          
          return (
            <Button
              key={mode.id}
              variant="outline"
              size="sm"
              onClick={() => onModeChange(mode.id)}
              className={`h-16 p-3 flex flex-col items-center justify-center gap-1 border transition-all duration-200 ${
                isSelected 
                  ? 'bg-gray-800 text-white border-gray-800 shadow-lg hover:bg-gray-700' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-xs font-medium leading-tight">{mode.name}</span>
            </Button>
          );
        })}
      </div>
      <p className="text-sm text-gray-500 mt-3">
        {modes.find(m => m.id === selectedMode)?.description}
      </p>
    </div>
  );
}
