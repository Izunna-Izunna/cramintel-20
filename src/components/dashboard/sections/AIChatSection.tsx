
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, AlertCircle, Trash2 } from 'lucide-react';
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { user } = useAuth();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load chat history on component mount
  useEffect(() => {
    if (user) {
      loadChatHistory();
    }
  }, [user]);

  const loadChatHistory = async () => {
    if (!user) return;

    try {
      // Get the most recent conversation
      const { data: conversations, error: convError } = await supabase
        .from('cramintel_chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (convError) {
        console.error('Error loading conversations:', convError);
        return;
      }

      if (conversations && conversations.length > 0) {
        const conversation = conversations[0];
        setConversationId(conversation.id);

        // Load messages for this conversation
        const { data: chatMessages, error: msgError } = await supabase
          .from('cramintel_chat_messages')
          .select('*')
          .eq('conversation_id', conversation.id)
          .order('timestamp', { ascending: true });

        if (msgError) {
          console.error('Error loading messages:', msgError);
          return;
        }

        if (chatMessages && chatMessages.length > 0) {
          const formattedMessages: Message[] = chatMessages.map((msg) => ({
            id: msg.id,
            type: msg.role as 'bot' | 'user',
            content: msg.content,
            timestamp: msg.timestamp
          }));
          setMessages(formattedMessages);
        } else {
          // If no messages, add welcome message
          addWelcomeMessage();
        }
      } else {
        // Create new conversation and add welcome message
        await createNewConversation();
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      addWelcomeMessage();
    }
  };

  const createNewConversation = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cramintel_chat_conversations')
        .insert({
          user_id: user.id,
          title: 'AI Tutor Chat',
          course: 'General'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        return;
      }

      setConversationId(data.id);
      addWelcomeMessage();
    } catch (error) {
      console.error('Error creating conversation:', error);
      addWelcomeMessage();
    }
  };

  const addWelcomeMessage = () => {
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content: `Hello! I'm your AI tutor. I'm currently in ${selectedMode} mode, ready to help you learn. You can attach materials and ask me questions about them, or just chat directly!`,
      mode: selectedMode,
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMessage]);
  };

  const saveMessageToDatabase = async (message: Message) => {
    if (!user || !conversationId) return;

    try {
      await supabase
        .from('cramintel_chat_messages')
        .insert({
          conversation_id: conversationId,
          role: message.type,
          content: message.content,
          timestamp: message.timestamp
        });

      // Update conversation timestamp
      await supabase
        .from('cramintel_chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const clearChatHistory = async () => {
    if (!user || !conversationId) return;

    try {
      // Delete all messages in the current conversation
      await supabase
        .from('cramintel_chat_messages')
        .delete()
        .eq('conversation_id', conversationId);

      // Reset messages and add welcome message
      setMessages([]);
      addWelcomeMessage();
      setError(null);
    } catch (error) {
      console.error('Error clearing chat history:', error);
      setError('Failed to clear chat history');
    }
  };

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
    saveMessageToDatabase(modeMessage);
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
    saveMessageToDatabase(userMessage);
    setMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const materialsWithContent = await Promise.all(
        attachedMaterials.map(async (material) => {
          if (material.type === 'material') {
            const content = await fetchMaterialContent(material.id);
            return { ...material, content };
          }
          return material;
        })
      );

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
      saveMessageToDatabase(botResponse);
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
      saveMessageToDatabase(errorBotResponse);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 font-space mb-2">AI Tutor</h2>
          <p className="text-gray-600">Get personalized help with different AI modes and attach your materials for context</p>
        </div>
        <Button
          onClick={clearChatHistory}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
          Clear History
        </Button>
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
