
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const quickActions = [
  {
    icon: "📤",
    title: "Upload Material",
    description: "Add notes or past questions",
    variant: "primary"
  },
  {
    icon: "🔮",
    title: "View Predictions",
    description: "See likely exam questions",
    variant: "secondary"
  },
  {
    icon: "💬",
    title: "Ask AI About Notes",
    description: "Get instant explanations",
    variant: "accent"
  },
  {
    icon: "🧠",
    title: "Practice Flashcards",
    description: "Review your study cards",
    variant: "muted"
  },
  {
    icon: "🧾",
    title: "View Assignments",
    description: "Check upcoming tasks",
    variant: "outline"
  }
];

export function QuickActions() {
  const getButtonClasses = (variant: string) => {
    switch (variant) {
      case 'primary':
        return 'bg-gray-800 hover:bg-gray-700 text-white border-gray-800';
      case 'secondary':
        return 'bg-gray-700 hover:bg-gray-600 text-white border-gray-700';
      case 'accent':
        return 'bg-gray-600 hover:bg-gray-500 text-white border-gray-600';
      case 'muted':
        return 'bg-gray-500 hover:bg-gray-400 text-white border-gray-500';
      default:
        return 'bg-white hover:bg-gray-50 text-gray-800 border-gray-200 hover:border-gray-300';
    }
  };

  return (
    <Card className="border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
      <CardContent className="p-4 sm:p-6 md:p-8">
        <h3 className="text-xl sm:text-2xl font-bold mb-4 md:mb-6 text-gray-800 font-space">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              className={`${getButtonClasses(action.variant)} h-auto p-4 sm:p-5 md:p-6 flex flex-col items-center gap-2 md:gap-3 hover:-translate-y-1 transition-all duration-300 rounded-xl`}
            >
              <span className="text-2xl md:text-3xl">{action.icon}</span>
              <div className="text-center">
                <div className="font-semibold text-xs sm:text-sm mb-1">{action.title}</div>
                <div className="text-[10px] sm:text-xs opacity-90">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
