
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Calendar, Trophy } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';

export function StudyStreak() {
  const { stats, loading } = useDashboardData();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5" />
            <div className="h-5 bg-gray-200 rounded w-24 animate-pulse"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-gray-200 rounded w-16"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStreakMessage = () => {
    if (stats.studyStreak === 0) return "Ready to start your streak?";
    if (stats.studyStreak === 1) return "Great start! Keep it going!";
    if (stats.studyStreak < 7) return "Building momentum!";
    if (stats.studyStreak < 30) return "Fantastic streak!";
    return "You're on fire! 🔥";
  };

  const getStreakColor = () => {
    if (stats.studyStreak === 0) return "secondary";
    if (stats.studyStreak < 7) return "outline";
    if (stats.studyStreak < 30) return "default";
    return "destructive";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className={`w-5 h-5 ${stats.studyStreak > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
          Study Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-800 mb-2">
            {stats.studyStreak}
          </div>
          <p className="text-sm text-gray-600">
            {stats.studyStreak === 1 ? 'day' : 'days'} in a row
          </p>
        </div>

        <div className="flex justify-center">
          <Badge variant={getStreakColor()} className="text-sm">
            {getStreakMessage()}
          </Badge>
        </div>

        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-sm font-medium">Current Status</p>
              <p className="text-xs text-gray-500">
                {stats.studyStreak > 0 
                  ? `Last studied today` 
                  : 'Start studying to begin your streak'}
              </p>
            </div>
          </div>

          {stats.studyStreak >= 7 && (
            <div className="flex items-center gap-3">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Achievement Unlocked!</p>
                <p className="text-xs text-gray-500">
                  {stats.studyStreak >= 30 ? 'Study Master' : 'Week Warrior'}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
