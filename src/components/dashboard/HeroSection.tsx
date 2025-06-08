
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, Brain, Target } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useAuth } from '@/hooks/useAuth';

export function HeroSection() {
  const { user } = useAuth();
  const { stats, loading } = useDashboardData();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage = (stats.weeklyUploads / stats.weeklyTarget) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 font-space">
          Welcome back, {user?.email?.split('@')[0] || 'Student'}! 🎓
        </h1>
        <p className="text-gray-600 mt-2">Here's your study progress overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium text-gray-600">Weekly Progress</span>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {stats.weeklyUploads}/{stats.weeklyTarget}
                </div>
                <p className="text-sm text-gray-500 mt-1">Materials uploaded</p>
              </div>
            </div>
            <div className="mt-4">
              <Progress value={Math.min(progressPercentage, 100)} className="h-2" />
              <p className="text-xs text-gray-500 mt-2">
                {progressPercentage >= 100 ? '🎉 Target achieved!' : `${Math.round(progressPercentage)}% of weekly goal`}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-gray-600">Flashcards</span>
                </div>
                <div className="text-2xl font-bold text-gray-800">{stats.totalFlashcards}</div>
                <p className="text-sm text-gray-500 mt-1">Ready for review</p>
              </div>
            </div>
            <div className="mt-4">
              <Badge variant={stats.totalFlashcards > 0 ? "default" : "secondary"}>
                {stats.totalFlashcards > 0 ? 'Active' : 'Getting started'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-purple-500" />
                  <span className="text-sm font-medium text-gray-600">Study Streak</span>
                </div>
                <div className="text-2xl font-bold text-gray-800">{stats.studyStreak}</div>
                <p className="text-sm text-gray-500 mt-1">Days in a row</p>
              </div>
            </div>
            <div className="mt-4">
              <Badge variant={stats.studyStreak > 0 ? "default" : "outline"}>
                {stats.studyStreak > 0 ? `${stats.studyStreak} day streak!` : 'Start your streak'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
