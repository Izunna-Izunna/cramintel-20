
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface StudySuggestion {
  id: string;
  type: string;
  title: string;
  description: string;
  action_text: string;
  action_url?: string;
  icon: string;
  priority: number;
  course?: string;
}

export function useStudySuggestions() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<StudySuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    try {
      setError(null);
      
      // Query the study_suggestions table directly
      const { data, error } = await supabase
        .from('study_suggestions')
        .select('*')
        .or(`user_id.eq.${user?.id},user_id.is.null`)
        .order('priority', { ascending: true })
        .limit(5);

      if (error) {
        console.error('Error fetching study suggestions:', error);
        // Fallback to hardcoded suggestions for now
        const fallbackSuggestions: StudySuggestion[] = [
          {
            id: '1',
            type: 'tip',
            title: 'Review Recommendation',
            description: 'Try reviewing this past question — it\'s similar to what came out last year.',
            action_text: 'Review Now',
            icon: '💡',
            priority: 1
          },
          {
            id: '2',
            type: 'community',
            title: 'Community Activity',
            description: 'Students in ENG301 are uploading a lot about Thermo Laws. Want to explore?',
            action_text: 'Explore',
            icon: '👥',
            priority: 2
          },
          {
            id: '3',
            type: 'leaderboard',
            title: 'Leaderboard Update',
            description: 'Top contributors in your department this week',
            action_text: 'View Leaderboard',
            icon: '🏆',
            priority: 3
          }
        ];
        setSuggestions(fallbackSuggestions);
        return;
      }

      // Transform the data to match our interface
      const transformedSuggestions = data?.map(s => ({
        id: s.id,
        type: s.type,
        title: s.title,
        description: s.description,
        action_text: s.action_text,
        action_url: s.action_url,
        icon: s.icon,
        priority: s.priority,
        course: s.course
      })) || [];

      setSuggestions(transformedSuggestions);
    } catch (err) {
      console.error('Error fetching study suggestions:', err);
      setError('Failed to load study suggestions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSuggestions();
    }
  }, [user]);

  return {
    suggestions,
    loading,
    error,
    refetch: fetchSuggestions
  };
}
