
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { AIModeSelector, AIMode } from './ai-chat/AIModeSelector';
import { MaterialAttachment } from './ai-chat/MaterialAttachment';
import { ChatMessage } from './ai-chat/ChatMessage';
import { QuickActions } from './ai-chat/QuickActions';

interface AttachedMaterial {
  id: string;
  name: string;
  type: 'material' | 'upload';
  content?: string;
}

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  mode?: AIMode;
  timestamp: string;
}

export function AIChatSection() {
  const [selectedMode, setSelectedMode] = useState<AIMode>('tutor');
  const [attachedMaterials, setAttachedMaterials] = useState<AttachedMaterial[]>([]);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: `Hello! I'm your AI tutor. I'm currently in ${selectedMode} mode, ready to help you learn. You can attach materials and ask me questions about them, or just chat directly!`,
      mode: selectedMode,
      timestamp: new Date().toISOString()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleModeChange = (mode: AIMode) => {
    setSelectedMode(mode);
    const modeMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content: `I'm now in ${mode} mode. ${getModeDescription(mode)} How can I help you?`,
      mode: mode,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, modeMessage]);
  };

  const getModeDescription = (mode: AIMode): string => {
    const descriptions = {
      tutor: "I'll guide you step-by-step through concepts and provide progressive learning.",
      explain: "I'll provide detailed explanations with examples and context.",
      quiz: "I'll create interactive tests and provide instant feedback.",
      summarize: "I'll extract key points and organize information clearly.",
      analyze: "I'll help you analyze patterns and think critically about the content.",
      practice: "I'll create practice problems and help you prepare for exams."
    };
    return descriptions[mode];
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    // Simulate AI response (replace with actual AI integration)
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: generateMockResponse(selectedMode, message, attachedMaterials),
        mode: selectedMode,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const generateMockResponse = (mode: AIMode, userMessage: string, materials: AttachedMaterial[]): string => {
    const materialContext = materials.length > 0 ? 
      `\n\nBased on the ${materials.length} attached material(s): ${materials.map(m => m.name).join(', ')}, ` : '';
    
    const responses = {
      tutor: `Let me break this down step by step for you.${materialContext}First, let's identify the key concept...`,
      explain: `Here's a detailed explanation of your question.${materialContext}The main idea is...`,
      quiz: `Let me create a quick quiz based on your question.${materialContext}Question 1: What is...?`,
      summarize: `Here's a summary of the key points.${materialContext}Main concepts: 1)... 2)... 3)...`,
      analyze: `Let's analyze this critically.${materialContext}I notice several patterns here...`,
      practice: `Here are some practice problems for you.${materialContext}Problem 1: Try to solve...`
    };
    
    return responses[mode] || "I'm here to help! How can I assist you?";
  };

  const handleQuickAction = (action: string) => {
    setMessage(action);
  };

  const handleAttachMaterials = (materials: AttachedMaterial[]) => {
    setAttachedMaterials(materials);
  };

  const handleDetachMaterial = (materialId: string) => {
    setAttachedMaterials(prev => prev.filter(m => m.id !== materialId));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 font-space mb-2">AI Tutor</h2>
        <p className="text-gray-600">Get personalized help with different AI modes and attach your materials for context</p>
      </div>

      <Card className="h-[calc(100vh-200px)] flex flex-col">
        <AIModeSelector selectedMode={selectedMode} onModeChange={handleModeChange} />
        
        <MaterialAttachment
          attachedMaterials={attachedMaterials}
          onAttach={handleAttachMaterials}
          onDetach={handleDetachMaterial}
        />

        <CardContent className="flex-1 flex flex-col p-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                type={msg.type}
                content={msg.content}
                mode={msg.mode}
                timestamp={msg.timestamp}
              />
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="text-sm text-gray-500">AI is thinking...</div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={`Ask something in ${selectedMode} mode...`}
                className="flex-1"
                disabled={isLoading}
              />
              <Button 
                onClick={handleSendMessage}
                className="bg-gray-800 hover:bg-gray-700"
                disabled={isLoading || !message.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>

        <QuickActions mode={selectedMode} onQuickAction={handleQuickAction} />
      </Card>
    </div>
  );
}
