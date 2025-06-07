
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface HeroSectionProps {
  userData: any;
}

export function HeroSection({ userData }: HeroSectionProps) {
  return (
    <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Hey {userData.name}, let's focus on what matters today 👇
            </h2>
            <p className="text-blue-100">
              You're making great progress! Keep up the momentum.
            </p>
          </div>
          
          <div className="space-y-3 min-w-[280px]">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Weekly uploads</span>
                <span>3/5 materials</span>
              </div>
              <Progress value={60} className="h-2" />
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <span>✅ 2 flashcard decks reviewed today</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
