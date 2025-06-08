
import React from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useAuth } from '@/hooks/useAuth';

export function HeroSection() {
  const { user } = useAuth();
  const { stats, loading } = useDashboardData();

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg p-8 text-white animate-pulse">
        <div className="h-8 bg-gray-600 rounded w-1/2 mb-4"></div>
        <div className="h-6 bg-gray-600 rounded w-1/3"></div>
      </div>
    );
  }

  const userName = user?.email?.split('@')[0] || 'Student';

  return (
    <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg p-8 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400 rounded-full opacity-10 transform translate-x-16 -translate-y-16"></div>
      
      <div className="flex justify-between items-start relative z-10">
        {/* Left side - Main content */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            Hey {userName}, let's focus on what matters today 
            <span className="text-2xl">👇</span>
          </h1>
          <p className="text-slate-300 text-lg">
            You're making great progress! Keep up the momentum.
          </p>
        </div>

        {/* Right side - Stats */}
        <div className="flex flex-col gap-4 ml-8">
          {/* Weekly uploads */}
          <div className="bg-black/20 rounded-lg px-4 py-3 min-w-[200px]">
            <div className="text-slate-300 text-sm mb-1">Weekly uploads</div>
            <div className="text-white font-semibold">
              {stats.weeklyUploads}/{stats.weeklyTarget} materials
            </div>
          </div>

          {/* Flashcard decks */}
          <div className="flex items-center gap-2 text-green-400">
            <span className="text-lg">✅</span>
            <span className="text-sm">
              {stats.totalFlashcards > 0 ? `${Math.floor(stats.totalFlashcards / 10)} flashcard decks reviewed today` : 'No flashcard reviews yet'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
