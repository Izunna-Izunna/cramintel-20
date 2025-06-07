
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Plus, Play } from 'lucide-react';

export function FlashcardsSection() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 font-space mb-2">Flashcards</h2>
          <p className="text-gray-600">Review and practice with your AI-generated flashcards</p>
        </div>
        <Button className="bg-gray-800 hover:bg-gray-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Deck
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((deck) => (
          <Card key={deck} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Brain className="w-8 h-8 text-blue-500" />
                <span className="text-sm text-gray-500">25 cards</span>
              </div>
              <CardTitle className="text-lg">Biology Chapter {deck}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Cell structure and function fundamentals</p>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  <Play className="w-4 h-4 mr-2" />
                  Study
                </Button>
                <Button size="sm" variant="outline">
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Study Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Cards mastered today</span>
              <span className="font-semibold">12/20</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
