
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
      // Use a raw query since the table might not be in the generated types yet
      const { data, error } = await supabase.rpc('get_quiz_questions');

      if (error) {
        console.error('Error fetching quiz questions:', error);
        // Fallback to hardcoded questions for now
        const fallbackQuestions: QuizQuestion[] = [
          {
            id: '1',
            question: 'What is the time complexity of binary search?',
            options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
            correct_answer: 1,
            difficulty: 'medium',
            category: 'algorithms',
            course: 'Computer Science'
          },
          {
            id: '2',
            question: 'Which data structure uses LIFO principle?',
            options: ['Queue', 'Stack', 'Array', 'Linked List'],
            correct_answer: 1,
            difficulty: 'easy',
            category: 'data-structures',
            course: 'Computer Science'
          },
          {
            id: '3',
            question: 'What does CPU stand for?',
            options: ['Computer Processing Unit', 'Central Processing Unit', 'Central Program Unit', 'Computer Program Unit'],
            correct_answer: 1,
            difficulty: 'easy',
            category: 'hardware',
            course: 'Computer Science'
          }
        ];
        setQuestions(fallbackQuestions);
        return;
      }

      setQuestions(data || []);
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
