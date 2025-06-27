
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, RotateCcw, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  course: string;
  difficulty_level: string;
  times_reviewed?: number;
}

export function FlashcardOfTheDay() {
  const { user } = useAuth();
  const [flashcard, setFlashcard] = useState<Flashcard | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDailyFlashcard = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Get a random flashcard that's due for review
      const { data: flashcards, error } = await supabase
        .from('cramintel_flashcards')
        .select('id, question, answer, course, difficulty_level, times_reviewed')
        .eq('user_id', user.id)
        .order('last_reviewed', { ascending: true, nullsFirst: true })
        .limit(5);

      if (error) {
        console.error('Error fetching flashcards:', error);
        return;
      }

      if (flashcards && flashcards.length > 0) {
        // Select a random flashcard from the top 5 most due for review
        const randomIndex = Math.floor(Math.random() * flashcards.length);
        setFlashcard(flashcards[randomIndex]);
      }
    } catch (error) {
      console.error('Error fetching daily flashcard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyFlashcard();
  }, [user]);

  const handleNewCard = () => {
    setShowAnswer(false);
    fetchDailyFlashcard();
  };

  const markAsReviewed = async () => {
    if (!flashcard) return;

    try {
      // Use only the ID for the update query to avoid RLS issues
      const { error } = await supabase
        .from('cramintel_flashcards')
        .update({ 
          last_reviewed: new Date().toISOString(),
          times_reviewed: (flashcard.times_reviewed || 0) + 1
        })
        .eq('id', flashcard.id);

      if (error) {
        console.error('Error marking flashcard as reviewed:', error);
      }
    } catch (error) {
      console.error('Error marking flashcard as reviewed:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!flashcard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Flashcard of the Day
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No flashcards available</p>
            <p className="text-gray-400 text-xs mt-1">Upload materials to generate flashcards</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Flashcard of the Day
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="outline">{flashcard.course}</Badge>
          <Badge variant="secondary" className="text-xs">
            {flashcard.difficulty_level}
          </Badge>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Question:</h4>
          <p className="text-gray-700">{flashcard.question}</p>
        </div>

        {showAnswer && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Answer:</h4>
            <p className="text-blue-700">{flashcard.answer}</p>
          </div>
        )}

        <div className="flex gap-2">
          {!showAnswer ? (
            <Button 
              onClick={() => setShowAnswer(true)}
              className="flex-1"
            >
              Show Answer
            </Button>
          ) : (
            <>
              <Button 
                onClick={() => {
                  markAsReviewed();
                  handleNewCard();
                }}
                className="flex-1"
                variant="default"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Got it!
              </Button>
              <Button 
                onClick={handleNewCard}
                variant="outline"
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Next Card
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
