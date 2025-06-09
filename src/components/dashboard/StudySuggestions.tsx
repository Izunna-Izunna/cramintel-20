
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudySuggestions } from '@/hooks/useStudySuggestions';

export function StudySuggestions() {
  const { suggestions, loading, error } = useStudySuggestions();

  if (loading) {
    return (
      <Card className="border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-3 text-gray-800 font-space text-lg sm:text-xl">
            🧭 Smart Study Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-3 md:space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 md:p-4 bg-gray-50 rounded-xl">
                <div className="flex items-start gap-3 md:gap-4">
                  <Skeleton className="w-6 h-6 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !suggestions.length) {
    return (
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-3 text-gray-800 font-space text-lg sm:text-xl">
            🧭 Smart Study Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="text-center py-6">
            <p className="text-gray-500 text-sm">
              {error || 'No study suggestions available'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-3 text-gray-800 font-space text-lg sm:text-xl">
          🧭 Smart Study Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="space-y-3 md:space-y-4">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="p-3 md:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300">
              <div className="flex items-start gap-3 md:gap-4">
                <span className="text-lg md:text-xl">{suggestion.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-700 mb-2 md:mb-3 leading-relaxed">{suggestion.description}</p>
                  <button className="text-[10px] sm:text-xs text-gray-600 hover:text-gray-800 font-medium hover:underline transition-colors duration-200">
                    {suggestion.action_text} →
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
