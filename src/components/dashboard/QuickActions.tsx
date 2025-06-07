
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const quickActions = [
  {
    icon: "📤",
    title: "Upload Material",
    description: "Add notes or past questions",
    color: "bg-green-500 hover:bg-green-600"
  },
  {
    icon: "🔮",
    title: "View Predictions",
    description: "See likely exam questions",
    color: "bg-purple-500 hover:bg-purple-600"
  },
  {
    icon: "💬",
    title: "Ask AI About Notes",
    description: "Get instant explanations",
    color: "bg-blue-500 hover:bg-blue-600"
  },
  {
    icon: "🧠",
    title: "Practice Flashcards",
    description: "Review your study cards",
    color: "bg-orange-500 hover:bg-orange-600"
  },
  {
    icon: "🧾",
    title: "View Assignments",
    description: "Check upcoming tasks",
    color: "bg-red-500 hover:bg-red-600"
  }
];

export function QuickActions() {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              className={`${action.color} text-white h-auto p-4 flex flex-col items-center gap-2`}
            >
              <span className="text-2xl">{action.icon}</span>
              <div className="text-center">
                <div className="font-medium text-sm">{action.title}</div>
                <div className="text-xs opacity-90">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
