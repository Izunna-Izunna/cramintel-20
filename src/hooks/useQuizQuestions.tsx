
import { useState, useEffect } from 'react';

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
      // Mock data since quiz_questions table doesn't exist yet
      const mockQuestions: QuizQuestion[] = [
        {
          id: '1',
          question: 'What is the capital of France?',
          options: ['London', 'Berlin', 'Paris', 'Madrid'],
          correct_answer: 2,
          difficulty: 'easy',
          category: 'Geography',
          course: 'General Knowledge'
        },
        {
          id: '2',
          question: 'Which programming language is React based on?',
          options: ['Python', 'JavaScript', 'Java', 'C++'],
          correct_answer: 1,
          difficulty: 'medium',
          category: 'Technology',
          course: 'Computer Science'
        }
      ];
      
      setQuestions(mockQuestions);
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
