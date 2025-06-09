
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const suggestions = [
  {
    type: "tip",
    icon: "💡",
    text: "Try reviewing this past question — it's similar to what came out last year.",
    action: "Review Now"
  },
  {
    type: "community",
    icon: "👥",
    text: "Students in ENG301 are uploading a lot about Thermo Laws. Want to explore?",
    action: "Explore"
  },
  {
    type: "leaderboard",
    icon: "🏆",
    text: "Top contributors in your department this week",
    action: "View Leaderboard"
  }
];

export function StudySuggestions() {
  return (
    <Card className="border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-3 text-gray-800 font-space text-lg sm:text-xl">
          🧭 Smart Study Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="space-y-3 md:space-y-4">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="p-3 md:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300">
              <div className="flex items-start gap-3 md:gap-4">
                <span className="text-lg md:text-xl">{suggestion.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-700 mb-2 md:mb-3 leading-relaxed">{suggestion.text}</p>
                  <button className="text-[10px] sm:text-xs text-gray-600 hover:text-gray-800 font-medium hover:underline transition-colors duration-200">
                    {suggestion.action} →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
