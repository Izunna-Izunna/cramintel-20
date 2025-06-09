
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
      // Use a raw query since the table might not be in the generated types yet
      const { data, error } = await supabase.rpc('get_study_suggestions', { 
        user_id: user?.id 
      });

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

      setSuggestions(data || []);
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
