import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, AlertCircle } from 'lucide-react';
import { AIModeSelector, AIMode } from './ai-chat/AIModeSelector';
import { MaterialAttachment } from './ai-chat/MaterialAttachment';
import { ChatMessage } from './ai-chat/ChatMessage';
import { QuickActions } from './ai-chat/QuickActions';
import { ScrollButtons } from './ai-chat/ScrollButtons';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const chatContainerRef = useRef<HTMLDivElement>(null);

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

  const fetchMaterialContent = async (materialId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('cramintel_materials')
        .select('*')
        .eq('id', materialId)
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching material:', error);
        return null;
      }

      // For now, return basic material info
      // In the future, this would fetch the actual processed content
      return `Material: ${data.name}\nType: ${data.material_type}\nCourse: ${data.course}`;
    } catch (error) {
      console.error('Error fetching material content:', error);
      return null;
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);
    setError(null);

    try {
      // Fetch content for attached materials
      const materialsWithContent = await Promise.all(
        attachedMaterials.map(async (material) => {
          if (material.type === 'material') {
            const content = await fetchMaterialContent(material.id);
            return { ...material, content };
          }
          return material;
        })
      );

      // Call the AI chat edge function
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: userMessage.content,
          mode: selectedMode,
          attachedMaterials: materialsWithContent
        }
      });

      if (error) {
        throw error;
      }

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: data.response,
        mode: selectedMode,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      
      if (error.message?.includes('OpenAI')) {
        errorMessage = 'AI service is currently unavailable. Please check if the OpenAI API key is configured.';
      } else if (error.message?.includes('Unauthorized')) {
        errorMessage = 'Authentication error. Please try signing in again.';
      }

      setError(errorMessage);
      
      const errorBotResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: errorMessage,
        mode: selectedMode,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorBotResponse]);
    } finally {
      setIsLoading(false);
    }
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
    <div className="space-y-6 relative">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 font-space mb-2">AI Tutor</h2>
        <p className="text-gray-600">Get personalized help with different AI modes and attach your materials for context</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <Card className="h-[calc(100vh-200px)] flex flex-col">
        <AIModeSelector selectedMode={selectedMode} onModeChange={handleModeChange} />
        
        <MaterialAttachment
          attachedMaterials={attachedMaterials}
          onAttach={handleAttachMaterials}
          onDetach={handleDetachMaterial}
        />

        <CardContent className="flex-1 flex flex-col p-0">
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
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
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder={`Ask something in ${selectedMode} mode...`}
                className="flex-1"
                disabled={isLoading || !user}
              />
              <Button 
                onClick={handleSendMessage}
                className="bg-gray-800 hover:bg-gray-700"
                disabled={isLoading || !message.trim() || !user}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {!user && (
              <p className="text-xs text-gray-500 mt-2">Please sign in to use the AI tutor.</p>
            )}
          </div>
        </CardContent>

        <QuickActions mode={selectedMode} onQuickAction={handleQuickAction} />
      </Card>

      <ScrollButtons containerRef={chatContainerRef} />
    </div>
  );
}
