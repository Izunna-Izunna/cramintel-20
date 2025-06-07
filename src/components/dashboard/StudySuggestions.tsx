
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧭 Smart Study Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-lg">{suggestion.icon}</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 mb-2">{suggestion.text}</p>
                  <button className="text-xs text-blue-600 hover:underline">
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
