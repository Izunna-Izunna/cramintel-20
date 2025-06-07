import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { FileText, Upload, Brain, MessageSquare, Users, User, Home, Sparkles } from 'lucide-react';

interface AppSidebarProps {
  activeSection: string;
  setActiveSection: (section: any) => void;
}

export function AppSidebar({ activeSection, setActiveSection }: AppSidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'upload', label: 'Upload Materials', icon: Upload },
    { id: 'flashcards', label: 'Flashcards', icon: Brain },
    { id: 'predictions', label: 'AI Predictions', icon: Sparkles },
    { id: 'ai-chat', label: 'Ask AI', icon: MessageSquare },
    { id: 'pdf-viewer', label: 'PDF Viewer', icon: FileText },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>CramIntel</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => setActiveSection(item.id)}
                    isActive={activeSection === item.id}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
