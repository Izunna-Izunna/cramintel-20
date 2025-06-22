
import React from 'react';
import { Bot, User, BookOpen, Lightbulb, Target, FileQuestion, Brain, MessageSquare, Heart } from 'lucide-react';
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
  tutor: 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700',
  explain: 'bg-gradient-to-br from-green-100 to-green-200 text-green-700',
  quiz: 'bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700',
  summarize: 'bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700',
  analyze: 'bg-gradient-to-br from-red-100 to-red-200 text-red-700',
  practice: 'bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-700'
};

const modeBackgrounds = {
  tutor: 'bg-gradient-to-r from-blue-50 to-blue-100/80 border-blue-200',
  explain: 'bg-gradient-to-r from-green-50 to-green-100/80 border-green-200',
  quiz: 'bg-gradient-to-r from-purple-50 to-purple-100/80 border-purple-200',
  summarize: 'bg-gradient-to-r from-orange-50 to-orange-100/80 border-orange-200',
  analyze: 'bg-gradient-to-r from-red-50 to-red-100/80 border-red-200',
  practice: 'bg-gradient-to-r from-indigo-50 to-indigo-100/80 border-indigo-200'
};

export function ChatMessage({ type, content, mode, timestamp }: ChatMessageProps) {
  const ModeIcon = mode ? modeIcons[mode] : Heart;
  const modeColorClass = mode ? modeColors[mode] : 'bg-gradient-to-br from-pink-100 to-pink-200 text-pink-700';
  const modeBackgroundClass = mode ? modeBackgrounds[mode] : 'bg-gradient-to-r from-pink-50 to-pink-100/80 border-pink-200';

  return (
    <div className={`flex gap-3 ${type === 'user' ? 'justify-end' : ''} mb-4`}>
      <div className={`flex gap-3 max-w-[85%] ${type === 'user' ? 'flex-row-reverse' : ''}`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
          type === 'bot' ? modeColorClass : 'bg-gradient-to-br from-gray-700 to-gray-800 text-white'
        }`}>
          {type === 'bot' ? <ModeIcon className="w-5 h-5" /> : <User className="w-5 h-5" />}
        </div>
        <div className={`rounded-xl p-4 shadow-sm ${
          type === 'bot' 
            ? `${modeBackgroundClass} border-2` 
            : 'bg-gradient-to-r from-gray-800 to-gray-900 text-white border-2 border-gray-700'
        }`}>
          <MathText className={`text-sm leading-relaxed ${
            type === 'bot' ? 'text-gray-800' : 'text-white'
          }`}>
            {content}
          </MathText>
          {timestamp && (
            <div className={`text-xs mt-2 ${
              type === 'bot' ? 'text-gray-500' : 'text-gray-300'
            }`}>
              {new Date(timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
