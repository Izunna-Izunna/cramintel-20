
import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardHeaderProps {
  userData: any;
}

export function DashboardHeader({ userData }: DashboardHeaderProps) {
  const isMobile = useIsMobile();

  return (
    <header className="border-b border-gray-100 bg-white p-3 sm:p-4 md:p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-6">
          <SidebarTrigger className="text-gray-600 hover:text-gray-800 hover:bg-gray-100" />
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 font-space">Dashboard</h1>
        </div>
        
        <div className="flex items-center gap-3 md:gap-6">
          <Button variant="ghost" size="sm" className="relative text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-2">
            🔔
            <span className="absolute -top-1 -right-1 bg-gray-700 text-white text-xs rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center text-[10px] md:text-xs">
              3
            </span>
          </Button>
          
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white font-semibold shadow-sm text-sm md:text-base">
              {userData.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {!isMobile && (
              <span className="font-semibold text-gray-800 text-sm md:text-base">{userData.name}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
