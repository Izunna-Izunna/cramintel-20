
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { shouldUseMockData, mockDashboardStats, mockDelay } from '@/services/mockDataService';

interface DashboardStats {
  weeklyUploads: number;
  weeklyTarget: number;
  totalFlashcards: number;
  studyStreak: number;
  coursesProgress: Array<{
    name: string;
    progress: number;
    uploads: number;
    target: number;
  }>;
  recentActivity: Array<{
    type: 'upload' | 'study' | 'flashcard';
    title: string;
    time: string;
    course?: string;
  }>;
}

export function useDashboardData() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    weeklyUploads: 0,
    weeklyTarget: 5,
    totalFlashcards: 0,
    studyStreak: 0,
    coursesProgress: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Use mock data in demo mode
    if (shouldUseMockData()) {
      await mockDelay();
      setStats(mockDashboardStats);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      // Get user profile for courses
      const { data: profile } = await supabase
        .from('cramintel_user_profiles')
        .select('courses')
        .eq('id', user.id)
        .single();

      const userCourses = profile?.courses || [];

      // Get weekly uploads (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { data: materials, error: materialsError } = await supabase
        .from('cramintel_materials')
        .select('*')
        .eq('user_id', user.id)
        .gte('upload_date', weekAgo.toISOString());

      if (materialsError) {
        // Handle RLS policy errors gracefully
        if (materialsError.code === '42501') {
          console.warn('RLS policy issue with materials table');
        } else {
          throw materialsError;
        }
      }

      // Get total flashcards
      const { data: flashcards, error: flashcardsError } = await supabase
        .from('cramintel_flashcards')
        .select('id')
        .eq('user_id', user.id);

      if (flashcardsError && flashcardsError.code !== '42501') {
        throw flashcardsError;
      }

      // Get study sessions for streak calculation with error handling
      let sessions = [];
      try {
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('cramintel_study_sessions')
          .select('started_at')
          .eq('user_id', user.id)
          .order('started_at', { ascending: false });

        if (sessionsError && sessionsError.code !== '42501') {
          throw sessionsError;
        }
        sessions = sessionsData || [];
      } catch (sessionErr) {
        console.warn('Could not fetch study sessions:', sessionErr);
      }

      // Calculate study streak
      const calculateStreak = () => {
        if (!sessions || sessions.length === 0) return 0;
        
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < sessions.length; i++) {
          const sessionDate = new Date(sessions[i].started_at);
          sessionDate.setHours(0, 0, 0, 0);
          
          const daysDiff = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff === streak) {
            streak++;
          } else {
            break;
          }
        }
        
        return streak;
      };

      // Calculate courses progress
      const coursesProgress = userCourses.map(course => {
        const courseMaterials = materials?.filter(m => m.course === course) || [];
        const uploads = courseMaterials.length;
        const target = 3; // Default target per course
        const progress = Math.min((uploads / target) * 100, 100);
        
        return {
          name: course,
          progress,
          uploads,
          target
        };
      });

      // Create recent activity
      const recentActivity = [];
      
      // Add recent uploads
      const recentUploads = materials?.slice(0, 3) || [];
      recentUploads.forEach(material => {
        recentActivity.push({
          type: 'upload' as const,
          title: `Uploaded ${material.name}`,
          time: new Date(material.upload_date || '').toLocaleDateString(),
          course: material.course || undefined
        });
      });

      // Add recent study sessions
      const recentSessions = sessions?.slice(0, 2) || [];
      recentSessions.forEach(session => {
        recentActivity.push({
          type: 'study' as const,
          title: 'Study session completed',
          time: new Date(session.started_at).toLocaleDateString()
        });
      });

      setStats({
        weeklyUploads: materials?.length || 0,
        weeklyTarget: 5,
        totalFlashcards: flashcards?.length || 0,
        studyStreak: calculateStreak(),
        coursesProgress,
        recentActivity: recentActivity.slice(0, 5)
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  return {
    stats,
    loading,
    error,
    refetch: fetchDashboardData
  };
}
