
import { useState, useEffect } from 'react';
import { GeneratedQuestion } from '@/types/predictions';

interface QuestionHistory {
  [course: string]: {
    answeredQuestionIds: string[];
    lastAnswered: string;
    totalAnswered: number;
  };
}

export function useQuestionHistory() {
  const [questionHistory, setQuestionHistory] = useState<QuestionHistory>({});

  // Load from localStorage on initialization
  useEffect(() => {
    const stored = localStorage.getItem('cramintel_question_history');
    if (stored) {
      try {
        setQuestionHistory(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading question history:', error);
      }
    }
  }, []);

  // Save to localStorage whenever history changes
  useEffect(() => {
    localStorage.setItem('cramintel_question_history', JSON.stringify(questionHistory));
  }, [questionHistory]);

  const generateQuestionId = (question: GeneratedQuestion): string => {
    // Create a unique ID based on question content
    return btoa(question.question?.substring(0, 100) || '').replace(/[^a-zA-Z0-9]/g, '');
  };

  const markQuestionsAsAnswered = (course: string, questions: GeneratedQuestion[], answers: Record<number, string>) => {
    const answeredIds = Object.keys(answers).map(index => 
      generateQuestionId(questions[parseInt(index) - 1])
    );

    setQuestionHistory(prev => ({
      ...prev,
      [course]: {
        answeredQuestionIds: [
          ...(prev[course]?.answeredQuestionIds || []),
          ...answeredIds
        ].slice(-200), // Keep only last 200 answered questions
        lastAnswered: new Date().toISOString(),
        totalAnswered: (prev[course]?.totalAnswered || 0) + answeredIds.length
      }
    }));
  };

  const filterUnseenQuestions = (course: string, questions: GeneratedQuestion[]): GeneratedQuestion[] => {
    const courseHistory = questionHistory[course];
    if (!courseHistory?.answeredQuestionIds.length) {
      return questions;
    }

    return questions.filter(question => {
      const questionId = generateQuestionId(question);
      return !courseHistory.answeredQuestionIds.includes(questionId);
    });
  };

  const shuffleQuestions = (questions: GeneratedQuestion[]): GeneratedQuestion[] => {
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const getQuestionStats = (course: string) => {
    const courseHistory = questionHistory[course];
    return {
      totalAnswered: courseHistory?.totalAnswered || 0,
      lastAnswered: courseHistory?.lastAnswered,
      hasHistory: (courseHistory?.answeredQuestionIds.length || 0) > 0
    };
  };

  const resetCourseHistory = (course: string) => {
    setQuestionHistory(prev => {
      const updated = { ...prev };
      delete updated[course];
      return updated;
    });
  };

  const resetAllHistory = () => {
    setQuestionHistory({});
  };

  return {
    markQuestionsAsAnswered,
    filterUnseenQuestions,
    shuffleQuestions,
    getQuestionStats,
    resetCourseHistory,
    resetAllHistory
  };
}
