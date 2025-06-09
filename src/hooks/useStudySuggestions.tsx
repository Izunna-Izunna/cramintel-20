
import { useState, useEffect } from 'react';
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
      // Mock data since study_suggestions table doesn't exist yet
      const mockSuggestions: StudySuggestion[] = [
        {
          id: '1',
          type: 'review',
          title: 'Review Thermodynamics',
          description: 'You haven\'t studied thermodynamics in 3 days',
          action_text: 'Start Review',
          icon: '🔥',
          priority: 1,
          course: 'Physics'
        },
        {
          id: '2',
          type: 'practice',
          title: 'Practice Calculus',
          description: 'Complete 5 more problems to master derivatives',
          action_text: 'Practice Now',
          icon: '📊',
          priority: 2,
          course: 'Mathematics'
        }
      ];

      setSuggestions(mockSuggestions);
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
