
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import CramIntelLogo from '@/components/CramIntelLogo';
import { Button } from '@/components/ui/button';

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: "📊",
  },
  {
    title: "Upload",
    url: "/upload",
    icon: "📤",
  },
  {
    title: "Flashcards",
    url: "/flashcards",
    icon: "🧠",
  },
  {
    title: "Predictions",
    url: "/predictions",
    icon: "🔮",
  },
  {
    title: "Ask AI",
    url: "/ai-chat",
    icon: "💬",
  },
  {
    title: "Community",
    url: "/community",
    icon: "👥",
  },
  {
    title: "Profile",
    url: "/profile",
    icon: "👤",
  },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('cramIntelUser');
    navigate('/');
  };

  return (
    <Sidebar className="border-gray-100">
      <SidebarHeader className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <CramIntelLogo size="sm" variant="dark" />
          <span className="font-bold text-xl text-gray-800 font-space">CramIntel</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="px-4 py-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    className={`
                      mb-1 rounded-xl transition-all duration-200 hover:bg-gray-50
                      ${location.pathname === item.url 
                        ? 'bg-gray-100 text-gray-800 font-semibold shadow-sm' 
                        : 'text-gray-600 hover:text-gray-800'
                      }
                    `}
                  >
                    <button
                      onClick={() => navigate(item.url)}
                      className="w-full text-left flex items-center gap-3 p-3"
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="font-medium">{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-6 border-t border-gray-100">
        <Button 
          onClick={handleLogout} 
          variant="outline" 
          className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
        >
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
