
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  difficulty: string;
  category: string;
  course?: string;
}

export function useQuizQuestions() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('active', true)
        .limit(10);

      if (error) {
        console.error('Error fetching quiz questions:', error);
        setError('Failed to load quiz questions');
        return;
      }

      const formattedQuestions = data?.map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]')
      })) || [];

      setQuestions(formattedQuestions);
    } catch (err) {
      console.error('Error fetching quiz questions:', err);
      setError('Failed to load quiz questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  return {
    questions,
    loading,
    error,
    refetch: fetchQuestions
  };
}
