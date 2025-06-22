import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, RotateCcw, CheckCircle, XCircle, Brain } from 'lucide-react';
import { FlashcardDeck } from '@/hooks/useFlashcardDecks';
import { useFlashcards } from '@/hooks/useFlashcardDecks';
import { useStudyAnalytics } from '@/hooks/useStudyAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import { MathText } from '@/components/ui/MathText';

interface StudyInterfaceProps {
  deck: FlashcardDeck;
  onExit: () => void;
  onComplete: () => void;
}

export function StudyInterface({ deck, onExit, onComplete }: StudyInterfaceProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studiedCards, setStudiedCards] = useState<Set<string>>(new Set());
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [sessionStartTime] = useState(Date.now());
  
  const { flashcards, loading, updateFlashcardMastery } = useFlashcards(deck.id);
  const { recordStudySession } = useStudyAnalytics();

  const currentCard = flashcards[currentCardIndex];
  const progress = flashcards.length > 0 ? ((currentCardIndex + 1) / flashcards.length) * 100 : 0;

  // Debug logging
  useEffect(() => {
    console.log('🎯 StudyInterface Debug Info:', {
      deckId: deck.id,
      deckName: deck.name,
      flashcardsCount: flashcards.length,
      currentCardIndex,
      currentCard,
      loading
    });
  }, [deck, flashcards, currentCardIndex, currentCard, loading]);

  const handleAnswer = async (correct: boolean) => {
    if (!currentCard) {
      console.log('⚠️ No current card available for answer');
      return;
    }

    console.log('📝 Handling answer:', { correct, cardId: currentCard.id });

    await updateFlashcardMastery(currentCard.id, correct);
    
    if (correct) {
      setCorrectAnswers(prev => prev + 1);
    }
    
    setStudiedCards(prev => new Set([...prev, currentCard.id]));
    
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      // Session complete
      const sessionDuration = Math.round((Date.now() - sessionStartTime) / (1000 * 60));
      
      await recordStudySession({
        course: deck.course || 'General',
        cards_studied: flashcards.length,
        cards_correct: correctAnswers + (correct ? 1 : 0),
        duration_minutes: Math.max(sessionDuration, 1)
      });
      
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleExit = async () => {
    if (studiedCards.size > 0) {
      const sessionDuration = Math.round((Date.now() - sessionStartTime) / (1000 * 60));
      
      await recordStudySession({
        course: deck.course || 'General',
        cards_studied: studiedCards.size,
        cards_correct: correctAnswers,
        duration_minutes: Math.max(sessionDuration, 1)
      });
    }
    
    onExit();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-20" />
          </div>
          <Skeleton className="h-96 w-full mb-6" />
          <div className="flex justify-center gap-4">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-12 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={handleExit}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Decks
              </Button>
              <h1 className="text-2xl font-bold text-gray-800">{deck.name}</h1>
            </div>
          </div>
          
          <div className="text-center py-12">
            <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No flashcards in this deck</h3>
            <p className="text-gray-600 mb-6">Add some flashcards to start studying!</p>
            <Button onClick={handleExit}>
              Return to Decks
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Safety check for current card
  if (!currentCard) {
    console.error('❌ Current card is null/undefined:', { currentCardIndex, flashcardsLength: flashcards.length });
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Brain className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Card loading error</h3>
            <p className="text-gray-600 mb-6">Unable to load the current flashcard</p>
            <Button onClick={handleExit}>
              Return to Decks
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleExit}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Decks
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{deck.name}</h1>
              <p className="text-gray-600">{deck.course}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              Card {currentCardIndex + 1} of {flashcards.length}
            </p>
            <p className="text-sm text-gray-600">
              Correct: {correctAnswers}/{studiedCards.size}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>Progress: {Math.round(progress)}%</span>
            <span>Accuracy: {studiedCards.size > 0 ? Math.round((correctAnswers / studiedCards.size) * 100) : 0}%</span>
          </div>
        </div>

        {/* Debug Info (remove in production) */}
        <div className="mb-4 p-2 bg-yellow-100 rounded text-xs">
          <strong>Debug:</strong> Card ID: {currentCard.id}, Question: {currentCard.question ? 'Present' : 'Missing'}, Answer: {currentCard.answer ? 'Present' : 'Missing'}
        </div>

        {/* Flashcard */}
        <div className="mb-8">
          <motion.div
            className="relative h-96 mx-auto max-w-2xl cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="absolute inset-0 shadow-lg">
              <CardContent className="h-full flex items-center justify-center p-8">
                <motion.div
                  className="text-center w-full"
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.6 }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {!isFlipped ? (
                    <div style={{ backfaceVisibility: 'hidden' }}>
                      <h3 className="text-lg font-semibold mb-4 text-gray-800">Question:</h3>
                      <MathText className="text-xl text-gray-700 leading-relaxed mb-6">
                        {currentCard.question || 'No question available'}
                      </MathText>
                      <p className="text-sm text-gray-500">Click to reveal answer</p>
                    </div>
                  ) : (
                    <div style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}>
                      <h3 className="text-lg font-semibold mb-4 text-gray-800">Answer:</h3>
                      <MathText className="text-xl text-gray-700 leading-relaxed">
                        {currentCard.answer || 'No answer available'}
                      </MathText>
                    </div>
                  )}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentCardIndex === 0}
          >
            Previous
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Flip Card
          </Button>
        </div>

        {/* Answer Buttons (only show when card is flipped) */}
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center gap-6"
          >
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleAnswer(false)}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <XCircle className="w-5 h-5 mr-2" />
              Incorrect
            </Button>
            
            <Button
              size="lg"
              onClick={() => handleAnswer(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Correct
            </Button>
          </motion.div>
        )}

        {/* Card Info */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-4 text-sm text-gray-600 bg-white px-4 py-2 rounded-lg shadow">
            <span>Difficulty: {currentCard.difficulty_level || 'N/A'}</span>
            <span>•</span>
            <span>Mastery: {currentCard.mastery_level || 0}/5</span>
            <span>•</span>
            <span>Reviewed: {currentCard.times_reviewed || 0} times</span>
          </div>
        </div>
      </div>
    </div>
  );
}
