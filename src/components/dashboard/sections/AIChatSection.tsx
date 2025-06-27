
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, AlertCircle, Trash2, Heart, Sparkles } from 'lucide-react';
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
          title: 'Study Session',
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
    const welcomeMessages = {
      tutor: "Hey there! I'm so excited to be your study buddy today! 🌟 I'm ready to help you understand any topic step by step. What would you like to explore together?",
      explain: "Hello! I'm here to make complex concepts crystal clear for you! ✨ What topic can I help you understand better today?",
      quiz: "Hi study champion! Ready to test your knowledge and have some fun with it? 🎯 I can create custom quizzes from your materials!",
      summarize: "Hey there, organized learner! I love turning complex information into clear, memorable summaries! 📝 What would you like me to break down for you?",
      analyze: "Hello, deep thinker! I'm excited to help you analyze and connect ideas in new ways! 🔍 What concepts shall we explore together?",
      practice: "Hey future exam ace! Let's practice and build your confidence! 💪 I'm here to help you succeed - what subject are we tackling today?"
    };

    const welcomeMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content: welcomeMessages[selectedMode],
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
    const modeMessages = {
      tutor: "Perfect! I'm now in tutor mode - ready to guide you through any concept step by step! 📚 What would you like to learn?",
      explain: "Great choice! I'm in explanation mode - ready to make any topic super clear with examples and connections! 💡 What shall we dive into?",
      quiz: "Awesome! Quiz mode activated - let's test your knowledge and make learning interactive! 🎯 Ready for some questions?",
      summarize: "Excellent! I'm in summary mode - ready to organize and highlight the key points from your materials! 📋 What needs summarizing?",
      analyze: "Wonderful! Analysis mode engaged - let's explore patterns, connections, and deeper insights together! 🔍 What shall we analyze?",
      practice: "Perfect! Practice mode ready - let's build your skills and confidence with targeted exercises! 💪 What subject are we practicing?"
    };

    const modeMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content: modeMessages[mode],
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
      
      let errorMessage = "Oops! I hit a little snag there. Let me try again - I'm determined to help you! 💪";
      
      if (error.message?.includes('OpenAI')) {
        errorMessage = "I'm having trouble connecting to my knowledge base right now. The OpenAI service might need attention from our tech team!";
      } else if (error.message?.includes('Unauthorized')) {
        errorMessage = "Looks like we need to refresh your connection. Try signing in again and I'll be right here waiting to help!";
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
          <h2 className="text-3xl font-bold text-gray-800 font-space mb-2 flex items-center gap-2">
            <Heart className="w-8 h-8 text-red-500" />
            Your Study Buddy
          </h2>
          <p className="text-gray-600">Your dedicated learning companion who knows your materials inside and out! 🌟</p>
        </div>
        <Button
          onClick={clearChatHistory}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
          Fresh Start
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <Card className="h-[calc(100vh-200px)] flex flex-col border-2 border-blue-100">
        <AIModeSelector selectedMode={selectedMode} onModeChange={handleModeChange} />
        
        <MaterialAttachment
          attachedMaterials={attachedMaterials}
          onAttach={handleAttachMaterials}
          onDetach={handleDetachMaterial}
        />

        <CardContent className="flex-1 flex flex-col p-0">
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-blue-50/30 to-white"
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
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-sm text-blue-700 font-medium">I'm thinking of the perfect way to help you... ✨</div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder={`What would you like to explore today? I'm excited to help! 🌟`}
                className="flex-1 border-2 border-blue-100 focus:border-blue-300"
                disabled={isLoading || !user}
              />
              <Button 
                onClick={handleSendMessage}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={isLoading || !message.trim() || !user}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {!user ? (
              <p className="text-xs text-gray-500 mt-2">Please sign in to chat with your study buddy!</p>
            ) : (
              <p className="text-xs text-blue-600 mt-2">💡 Tip: Attach your study materials so I can give you personalized help!</p>
            )}
          </div>
        </CardContent>

        <QuickActions mode={selectedMode} onQuickAction={handleQuickAction} />
      </Card>

      <ScrollButtons containerRef={chatContainerRef} />
    </div>
  );
}
