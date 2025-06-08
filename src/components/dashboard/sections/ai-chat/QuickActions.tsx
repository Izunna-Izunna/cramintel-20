
import React from 'react';
import { Button } from '@/components/ui/button';
import { AIMode } from './AIModeSelector';

interface QuickActionsProps {
  mode: AIMode;
  onQuickAction: (action: string) => void;
}

const quickActions = {
  tutor: [
    "Explain this step by step",
    "Give me practice problems",
    "Check my understanding",
    "Break down complex concepts"
  ],
  explain: [
    "Explain with examples",
    "What's the key concept?",
    "How does this work?",
    "Show me the reasoning"
  ],
  quiz: [
    "Create a quiz",
    "Test my knowledge",
    "Multiple choice questions",
    "True/false questions"
  ],
  summarize: [
    "Summarize key points",
    "Main concepts",
    "Create bullet points",
    "Highlight important facts"
  ],
  analyze: [
    "Analyze patterns",
    "Compare and contrast",
    "Find relationships",
    "Critical evaluation"
  ],
  practice: [
    "Practice problems",
    "Exam-style questions",
    "Review exercises",
    "Quick drills"
  ]
};

export function QuickActions({ mode, onQuickAction }: QuickActionsProps) {
  const actions = quickActions[mode] || [];

  return (
    <div className="p-4 border-t border-gray-200 bg-gray-50">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Actions</h4>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onQuickAction(action)}
            className="text-xs text-left justify-start h-auto p-2 bg-white hover:bg-gray-50"
          >
            "{action}"
          </Button>
        ))}
      </div>
    </div>
  );
}
