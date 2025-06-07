
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function StudyStreak() {
  return (
    <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔥 Study Streak
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="text-4xl font-bold text-orange-600 mb-2">3</div>
          <p className="text-lg font-medium text-gray-700 mb-1">Day Streak</p>
          <p className="text-sm text-gray-600 mb-4">Flashcard reviews — keep it going!</p>
          
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <div
                key={day}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                  ${day <= 3 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-200 text-gray-400'
                  }`}
              >
                {day <= 3 ? '🔥' : day}
              </div>
            ))}
          </div>
          
          <div className="text-xs text-gray-500">
            Review flashcards tomorrow to extend your streak!
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
