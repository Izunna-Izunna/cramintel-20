
import React from 'react';
import { Bot, User, BookOpen, Lightbulb, Target, FileQuestion, Brain, MessageSquare } from 'lucide-react';
import { AIMode } from './AIModeSelector';
import { MathText } from '@/components/ui/MathText';

interface ChatMessageProps {
  type: 'bot' | 'user';
  content: string;
  mode?: AIMode;
  timestamp?: string;
}

const modeIcons = {
  tutor: BookOpen,
  explain: Lightbulb,
  quiz: Target,
  summarize: FileQuestion,
  analyze: Brain,
  practice: MessageSquare
};

const modeColors = {
  tutor: 'bg-blue-100 text-blue-600',
  explain: 'bg-green-100 text-green-600',
  quiz: 'bg-purple-100 text-purple-600',
  summarize: 'bg-orange-100 text-orange-600',
  analyze: 'bg-red-100 text-red-600',
  practice: 'bg-gray-100 text-gray-600'
};

export function ChatMessage({ type, content, mode, timestamp }: ChatMessageProps) {
  const ModeIcon = mode ? modeIcons[mode] : Bot;
  const modeColorClass = mode ? modeColors[mode] : 'bg-gray-100 text-gray-600';

  return (
    <div className={`flex gap-3 ${type === 'user' ? 'justify-end' : ''} mb-4`}>
      <div className={`flex gap-3 max-w-[80%] ${type === 'user' ? 'flex-row-reverse' : ''}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          type === 'bot' ? modeColorClass : 'bg-gray-800 text-white'
        }`}>
          {type === 'bot' ? <ModeIcon className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </div>
        <div className={`rounded-lg p-3 ${
          type === 'bot' 
            ? 'bg-gray-50 border border-gray-200' 
            : 'bg-gray-800 text-white'
        }`}>
          <MathText className={`text-sm leading-relaxed ${
            type === 'bot' ? 'text-gray-900' : 'text-white'
          }`}>
            {content}
          </MathText>
          {timestamp && (
            <div className="text-xs text-gray-500 mt-1">
              {new Date(timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
