
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/AppSidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { HeroSection } from '@/components/dashboard/HeroSection';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { FlashcardOfTheDay } from '@/components/dashboard/FlashcardOfTheDay';
import { PredictionsFeed } from '@/components/dashboard/PredictionsFeed';
import { RecentUploads } from '@/components/dashboard/RecentUploads';
import { StudySuggestions } from '@/components/dashboard/StudySuggestions';
import { CourseProgress } from '@/components/dashboard/CourseProgress';
import { StudyStreak } from '@/components/dashboard/StudyStreak';
import { DailyQuiz } from '@/components/dashboard/DailyQuiz';
import { EnhancedUploadSection } from '@/components/dashboard/sections/EnhancedUploadSection';
import { EnhancedFlashcardsSection } from '@/components/dashboard/sections/EnhancedFlashcardsSection';
import { PredictionsSection } from '@/components/dashboard/sections/PredictionsSection';
import { AIChatSection } from '@/components/dashboard/sections/AIChatSection';
import { CommunitySection } from '@/components/dashboard/sections/CommunitySection';
import { ProfileSection } from '@/components/dashboard/sections/ProfileSection';
import { CBTSection } from '@/components/dashboard/sections/CBTSection';

export type DashboardSection = 'dashboard' | 'upload' | 'flashcards' | 'predictions' | 'ai-chat' | 'community' | 'profile' | 'cbt';

const Dashboard = () => {
  const userData = JSON.parse(localStorage.getItem('cramIntelUser') || '{}');
  const [activeSection, setActiveSection] = useState<DashboardSection>('dashboard');

  const handleSectionChange = (section: DashboardSection) => {
    setActiveSection(section);
  };

  const renderMainContent = () => {
    switch (activeSection) {
      case 'upload':
        return <EnhancedUploadSection />;
      case 'flashcards':
        return <EnhancedFlashcardsSection />;
      case 'predictions':
        return <PredictionsSection />;
      case 'ai-chat':
        return <AIChatSection />;
      case 'community':
        return <CommunitySection />;
      case 'profile':
        return <ProfileSection />;
      case 'cbt':
        return <CBTSection />;
      default:
        return (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <HeroSection />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <QuickActions />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="lg:col-span-2"
              >
                <FlashcardOfTheDay />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <StudyStreak />
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <PredictionsFeed />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <RecentUploads onSectionChange={handleSectionChange} />
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <CourseProgress />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <DailyQuiz />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <StudySuggestions />
              </motion.div>
            </div>
          </div>
        );
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader userData={userData} />
          
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderMainContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
