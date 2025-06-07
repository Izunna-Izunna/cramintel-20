
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function StudyStreak() {
  return (
    <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-gray-800 font-space">
          🔥 Study Streak
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="text-5xl font-bold text-gray-700 mb-3">3</div>
          <p className="text-xl font-semibold text-gray-800 mb-2">Day Streak</p>
          <p className="text-sm text-gray-600 mb-6">Flashcard reviews — keep it going!</p>
          
          <div className="flex justify-center gap-3 mb-6">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <div
                key={day}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300
                  ${day <= 3 
                    ? 'bg-gray-700 text-white shadow-sm' 
                    : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
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
