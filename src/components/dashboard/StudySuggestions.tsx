
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
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-gray-800 font-space">
          🧭 Smart Study Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300">
              <div className="flex items-start gap-4">
                <span className="text-xl">{suggestion.icon}</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 mb-3 leading-relaxed">{suggestion.text}</p>
                  <button className="text-xs text-gray-600 hover:text-gray-800 font-medium hover:underline transition-colors duration-200">
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
