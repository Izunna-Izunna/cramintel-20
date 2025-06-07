
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, Bot, User } from 'lucide-react';

export function AIChatSection() {
  const [message, setMessage] = useState('');
  const [messages] = useState([
    { type: 'bot', content: 'Hello! I\'m here to help you with your studies. What would you like to know?' },
    { type: 'user', content: 'Can you explain photosynthesis?' },
    { type: 'bot', content: 'Photosynthesis is the process by which plants convert light energy into chemical energy...' }
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 font-space mb-2">Ask AI</h2>
        <p className="text-gray-600">Get instant answers about your study materials</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Chat with AI
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.map((msg, index) => (
                  <div key={index} className={`flex gap-3 ${msg.type === 'user' ? 'justify-end' : ''}`}>
                    <div className={`flex gap-3 max-w-[80%] ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        msg.type === 'bot' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        {msg.type === 'bot' ? <Bot className="w-4 h-4 text-blue-600" /> : <User className="w-4 h-4 text-gray-600" />}
                      </div>
                      <div className={`p-3 rounded-lg ${
                        msg.type === 'bot' ? 'bg-gray-100' : 'bg-blue-500 text-white'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask a question about your notes..."
                  className="flex-1"
                />
                <Button className="bg-gray-800 hover:bg-gray-700">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button className="w-full text-left p-2 rounded hover:bg-gray-50 transition-colors text-sm">
                "Explain this concept"
              </button>
              <button className="w-full text-left p-2 rounded hover:bg-gray-50 transition-colors text-sm">
                "Create practice questions"
              </button>
              <button className="w-full text-left p-2 rounded hover:bg-gray-50 transition-colors text-sm">
                "Summarize this chapter"
              </button>
              <button className="w-full text-left p-2 rounded hover:bg-gray-50 transition-colors text-sm">
                "Find related topics"
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-gray-50 rounded">Photosynthesis</div>
                <div className="p-2 bg-gray-50 rounded">Cell Division</div>
                <div className="p-2 bg-gray-50 rounded">DNA Structure</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
