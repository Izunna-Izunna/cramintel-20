
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface StudyStats {
  flashcards_studied_today: number;
  cards_mastered_today: number;
  current_streak: number;
  best_streak: number;
  total_study_time_today: number;
  accuracy_rate_today: number;
}

export const useStudyAnalytics = () => {
  const [stats, setStats] = useState<StudyStats>({
    flashcards_studied_today: 0,
    cards_mastered_today: 0,
    current_streak: 0,
    best_streak: 0,
    total_study_time_today: 0,
    accuracy_rate_today: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchStats = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's analytics with error handling
      let todayData = null;
      try {
        const { data, error } = await supabase
          .from('cramintel_study_analytics')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', today)
          .maybeSingle();

        if (error && error.code !== '42501') {
          throw error;
        }
        todayData = data;
      } catch (err) {
        console.warn('Could not fetch today\'s analytics:', err);
      }

      // Get all analytics for streak calculation with error handling
      let allData = [];
      try {
        const { data, error } = await supabase
          .from('cramintel_study_analytics')
          .select('date, flashcards_studied')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (error && error.code !== '42501') {
          throw error;
        }
        allData = data || [];
      } catch (err) {
        console.warn('Could not fetch analytics history:', err);
      }

      // Calculate current and best streak
      let currentStreak = 0;
      let bestStreak = 0;
      let tempStreak = 0;

      if (allData && allData.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < allData.length; i++) {
          const dataDate = new Date(allData[i].date);
          dataDate.setHours(0, 0, 0, 0);
          
          const expectedDate = new Date(today);
          expectedDate.setDate(today.getDate() - i);

          if (dataDate.getTime() === expectedDate.getTime() && allData[i].flashcards_studied > 0) {
            currentStreak++;
            tempStreak++;
            bestStreak = Math.max(bestStreak, tempStreak);
          } else if (i === 0) {
            // Today has no activity, but check yesterday
            continue;
          } else {
            break;
          }
        }
      }

      setStats({
        flashcards_studied_today: todayData?.flashcards_studied || 0,
        cards_mastered_today: 0, // This would need to be calculated differently
        current_streak: currentStreak,
        best_streak: bestStreak,
        total_study_time_today: todayData?.total_study_time || 0,
        accuracy_rate_today: todayData?.accuracy_rate || 0
      });
    } catch (error) {
      console.error('Error fetching study stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const recordStudySession = async (sessionData: {
    course: string;
    cards_studied: number;
    cards_correct: number;
    duration_minutes: number;
  }) => {
    if (!user) return;

    try {
      // Record the study session with error handling
      try {
        const { error: sessionError } = await supabase
          .from('cramintel_study_sessions')
          .insert({
            user_id: user.id,
            course: sessionData.course,
            cards_studied: sessionData.cards_studied,
            cards_correct: sessionData.cards_correct,
            duration_minutes: sessionData.duration_minutes,
            session_type: 'flashcard_study',
            started_at: new Date(Date.now() - sessionData.duration_minutes * 60 * 1000).toISOString(),
            ended_at: new Date().toISOString()
          });

        if (sessionError && sessionError.code !== '42501') {
          console.error('Error recording study session:', sessionError);
          return;
        }
      } catch (err) {
        console.warn('Could not record study session, continuing with analytics:', err);
      }

      // Update or create today's analytics with error handling
      const today = new Date().toISOString().split('T')[0];
      const accuracy = sessionData.cards_studied > 0 ? (sessionData.cards_correct / sessionData.cards_studied) * 100 : 0;

      try {
        const { data: existingData } = await supabase
          .from('cramintel_study_analytics')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', today)
          .maybeSingle();

        if (existingData) {
          // Update existing record
          const { error } = await supabase
            .from('cramintel_study_analytics')
            .update({
              flashcards_studied: existingData.flashcards_studied + sessionData.cards_studied,
              total_study_time: existingData.total_study_time + sessionData.duration_minutes,
              accuracy_rate: ((existingData.accuracy_rate * existingData.flashcards_studied) + (accuracy * sessionData.cards_studied)) / (existingData.flashcards_studied + sessionData.cards_studied),
              courses_studied: Array.from(new Set([...(existingData.courses_studied || []), sessionData.course]))
            })
            .eq('id', existingData.id);

          if (error && error.code !== '42501') {
            console.error('Error updating analytics:', error);
          }
        } else {
          // Create new record
          const { error } = await supabase
            .from('cramintel_study_analytics')
            .insert({
              user_id: user.id,
              date: today,
              flashcards_studied: sessionData.cards_studied,
              total_study_time: sessionData.duration_minutes,
              accuracy_rate: accuracy,
              courses_studied: [sessionData.course],
              streak_days: 1
            });

          if (error && error.code !== '42501') {
            console.error('Error creating analytics:', error);
          }
        }
      } catch (err) {
        console.warn('Could not update study analytics:', err);
      }

      // Refresh stats
      await fetchStats();
    } catch (error) {
      console.error('Error recording study session:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  return {
    stats,
    loading,
    recordStudySession,
    refetchStats: fetchStats
  };
};
