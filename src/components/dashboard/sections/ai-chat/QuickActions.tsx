
import React from 'react';
import { Button } from '@/components/ui/button';
import { AIMode } from './AIModeSelector';

interface QuickActionsProps {
  mode: AIMode;
  onQuickAction: (action: string) => void;
}

const quickActions = {
  tutor: [
    "Walk me through this step by step please! 📚",
    "I'm stuck on this concept - can you help? 🤔", 
    "Let's practice together with some examples! ✨",
    "Can you check if I understand this correctly? 🎯"
  ],
  explain: [
    "Explain this with a real-world example! 🌟",
    "What's the main idea I should remember? 💡",
    "How does this actually work in practice? 🔍", 
    "Can you break this down simply for me? ✨"
  ],
  quiz: [
    "Create a fun quiz for me! 🎯",
    "Test my knowledge on this topic! 🧠",
    "Give me some practice questions! 📝",
    "Let's do a quick knowledge check! ⚡"
  ],
  summarize: [
    "Summarize the key points for me! 📋",
    "What are the most important concepts? ⭐",
    "Create a study guide from this! 📚",
    "Highlight what I need to remember! ✨"
  ],
  analyze: [
    "Help me see the bigger picture! 🔍",
    "What patterns can we find here? 🧩",
    "How do these concepts connect? 🔗",
    "Let's think critically about this! 💭"
  ],
  practice: [
    "Give me practice problems to solve! 💪",
    "Create exam-style questions for me! 📝",
    "Let's do some skill-building exercises! 🎯",
    "Help me prepare for my test! 🌟"
  ]
};

export function QuickActions({ mode, onQuickAction }: QuickActionsProps) {
  const actions = quickActions[mode] || [];

  return (
    <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
        ✨ Quick Ways to Get Started
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onQuickAction(action)}
            className="text-xs text-left justify-start h-auto p-3 bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 border-2 border-gray-200 hover:border-blue-300 transition-all duration-200"
          >
            {action}
          </Button>
        ))}
      </div>
    </div>
  );
}
