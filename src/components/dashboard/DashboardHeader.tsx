
import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

interface DashboardHeaderProps {
  userData: any;
}

export function DashboardHeader({ userData }: DashboardHeaderProps) {
  return (
    <header className="border-b border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <SidebarTrigger className="text-gray-600 hover:text-gray-800 hover:bg-gray-100" />
          <h1 className="text-3xl font-bold text-gray-800 font-space">Dashboard</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="sm" className="relative text-gray-600 hover:text-gray-800 hover:bg-gray-100">
            🔔
            <span className="absolute -top-1 -right-1 bg-gray-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              3
            </span>
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
              {userData.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className="font-semibold text-gray-800">{userData.name}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
