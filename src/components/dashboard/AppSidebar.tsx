
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import CramIntelLogo from '@/components/CramIntelLogo';
import { Button } from '@/components/ui/button';
import { DashboardSection } from '@/pages/Dashboard';

const menuItems = [{
  title: "Dashboard",
  section: "dashboard" as DashboardSection,
  icon: "📊"
}, {
  title: "Upload",
  section: "upload" as DashboardSection,
  icon: "📤"
}, {
  title: "Flashcards",
  section: "flashcards" as DashboardSection,
  icon: "🧠"
}, {
  title: "Predictions",
  section: "predictions" as DashboardSection,
  icon: "🔮"
}, {
  title: "CBT Test",
  section: "cbt" as DashboardSection,
  icon: "🖥️"
}, {
  title: "Ask AI",
  section: "ai-chat" as DashboardSection,
  icon: "💬"
}, {
  title: "Community",
  section: "community" as DashboardSection,
  icon: "👥"
}, {
  title: "Profile",
  section: "profile" as DashboardSection,
  icon: "👤"
}];

interface AppSidebarProps {
  activeSection: DashboardSection;
  setActiveSection: (section: DashboardSection) => void;
}

export function AppSidebar({
  activeSection,
  setActiveSection
}: AppSidebarProps) {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('cramIntelUser');
    navigate('/');
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  return <Sidebar className="border-gray-100">
      <SidebarHeader className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleLogoClick}
            className="hover:opacity-80 transition-opacity cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-300 rounded"
            aria-label="Go to homepage"
          >
            <CramIntelLogo size="sm" variant="dark" />
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="px-4 py-2">
              {menuItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={activeSection === item.section} className={`
                      mb-1 rounded-xl transition-all duration-200 hover:bg-gray-50
                      ${activeSection === item.section ? 'bg-gray-100 text-gray-800 font-semibold shadow-sm' : 'text-gray-600 hover:text-gray-800'}
                    `}>
                    <button onClick={() => setActiveSection(item.section)} className="w-full text-left flex items-center gap-3 p-3">
                      <span className="text-lg">{item.icon}</span>
                      <span className="font-medium">{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-6 border-t border-gray-100">
        <Button onClick={handleLogout} variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200">
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>;
}
