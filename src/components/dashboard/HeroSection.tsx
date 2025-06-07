
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface HeroSectionProps {
  userData: any;
}

export function HeroSection({ userData }: HeroSectionProps) {
  return (
    <Card className="bg-gradient-to-r from-gray-800 to-gray-700 text-white hover:shadow-lg transition-all duration-300">
      <CardContent className="p-4 sm:p-6 md:p-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 md:gap-6">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 md:mb-3 font-space">
              Hey {userData.name}, let's focus on what matters today 👇
            </h2>
            <p className="text-gray-200 text-sm sm:text-base md:text-lg">
              You're making great progress! Keep up the momentum.
            </p>
          </div>
          
          <div className="w-full lg:w-auto lg:min-w-[280px] xl:min-w-[300px] space-y-3 md:space-y-4">
            <div>
              <div className="flex justify-between text-xs sm:text-sm mb-2 text-gray-200">
                <span>Weekly uploads</span>
                <span>3/5 materials</span>
              </div>
              <Progress value={60} className="h-2 md:h-3 bg-gray-600" />
            </div>
            
            <div className="flex items-center gap-2 md:gap-3 text-xs sm:text-sm text-gray-200">
              <span>✅ 2 flashcard decks reviewed today</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
