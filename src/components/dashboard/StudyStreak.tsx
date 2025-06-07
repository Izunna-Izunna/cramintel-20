
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function StudyStreak() {
  return (
    <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:shadow-lg transition-all duration-300">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-3 text-gray-800 font-space text-lg sm:text-xl">
          🔥 Study Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="text-center">
          <div className="text-4xl sm:text-5xl font-bold text-gray-700 mb-2 md:mb-3">3</div>
          <p className="text-lg sm:text-xl font-semibold text-gray-800 mb-1 md:mb-2">Day Streak</p>
          <p className="text-xs sm:text-sm text-gray-600 mb-4 md:mb-6">Flashcard reviews — keep it going!</p>
          
          <div className="flex justify-center gap-2 md:gap-3 mb-4 md:mb-6">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <div
                key={day}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all duration-300
                  ${day <= 3 
                    ? 'bg-gray-700 text-white shadow-sm' 
                    : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                  }`}
              >
                {day <= 3 ? '🔥' : day}
              </div>
            ))}
          </div>
          
          <div className="text-[10px] sm:text-xs text-gray-500">
            Review flashcards tomorrow to extend your streak!
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
