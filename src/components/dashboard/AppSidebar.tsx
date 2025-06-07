
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
import { CramIntelLogo } from '@/components/CramIntelLogo';
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
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <CramIntelLogo size="sm" />
          <span className="font-bold text-lg">CramIntel</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                  >
                    <button
                      onClick={() => navigate(item.url)}
                      className="w-full text-left"
                    >
                      <span className="text-lg mr-3">{item.icon}</span>
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button onClick={handleLogout} variant="outline" className="w-full">
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
