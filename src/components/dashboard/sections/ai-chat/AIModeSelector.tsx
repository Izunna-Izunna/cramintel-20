
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
    description: 'Step-by-step guidance and progressive learning',
    color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
  },
  {
    id: 'explain' as AIMode,
    name: 'Explain',
    icon: Lightbulb,
    description: 'Deep explanations with examples and context',
    color: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
  },
  {
    id: 'quiz' as AIMode,
    name: 'Quiz',
    icon: Target,
    description: 'Interactive testing and instant feedback',
    color: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
  },
  {
    id: 'summarize' as AIMode,
    name: 'Summarize',
    icon: FileQuestion,
    description: 'Extract key points and organize information',
    color: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
  },
  {
    id: 'analyze' as AIMode,
    name: 'Analyze',
    icon: Brain,
    description: 'Critical analysis and pattern recognition',
    color: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
  },
  {
    id: 'practice' as AIMode,
    name: 'Practice',
    icon: MessageSquare,
    description: 'Practice problems and exam preparation',
    color: 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
  }
];

export function AIModeSelector({ selectedMode, onModeChange }: AIModeProps) {
  return (
    <div className="border-b border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">AI Mode</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;
          
          return (
            <Button
              key={mode.id}
              variant="outline"
              size="sm"
              onClick={() => onModeChange(mode.id)}
              className={`h-auto p-3 flex flex-col items-center gap-2 ${
                isSelected 
                  ? 'border-gray-800 bg-gray-800 text-white hover:bg-gray-700' 
                  : mode.color
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-xs font-medium">{mode.name}</span>
            </Button>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        {modes.find(m => m.id === selectedMode)?.description}
      </p>
    </div>
  );
}
