
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
      const { data, error } = await supabase
        .from('study_suggestions')
        .select('*')
        .or(`user_id.is.null,user_id.eq.${user?.id}`)
        .order('priority', { ascending: true })
        .limit(5);

      if (error) {
        console.error('Error fetching study suggestions:', error);
        setError('Failed to load study suggestions');
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
