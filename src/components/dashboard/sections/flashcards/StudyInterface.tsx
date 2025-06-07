
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

interface StudyInterfaceProps {
  deck: {
    id: number;
    title: string;
    cardCount: number;
    format: string;
  };
  onExit: () => void;
  onComplete: () => void;
}

interface Flashcard {
  id: number;
  front: string;
  back: string;
  mastered: boolean;
}

export function StudyInterface({ deck, onExit, onComplete }: StudyInterfaceProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 });

  // Sample flashcards - in real app, these would come from the deck
  const flashcards: Flashcard[] = [
    {
      id: 1,
      front: "What is the first law of thermodynamics?",
      back: "Energy cannot be created or destroyed, only transferred or converted from one form to another.",
      mastered: false
    },
    {
      id: 2,
      front: "Define entropy in thermodynamics.",
      back: "Entropy is a measure of the disorder or randomness in a system. It tends to increase in isolated systems.",
      mastered: false
    },
    {
      id: 3,
      front: "What is the difference between heat and temperature?",
      back: "Heat is the transfer of energy between objects at different temperatures. Temperature is a measure of the average kinetic energy of particles.",
      mastered: true
    }
  ];

  const currentCard = flashcards[currentCardIndex];
  const progress = ((currentCardIndex + 1) / flashcards.length) * 100;

  const handleCardResponse = (correct: boolean) => {
    setSessionStats(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      incorrect: prev.incorrect + (correct ? 0 : 1)
    }));

    // Move to next card
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      // Study session complete
      onComplete();
    }
  };

  const goToPreviousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const goToNextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  };

  const resetCard = () => {
    setIsFlipped(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onExit}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Decks
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{deck.title}</h2>
            <p className="text-gray-600">{deck.format} • Study Session</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">
            Card {currentCardIndex + 1} of {flashcards.length}
          </div>
          <div className="text-xs text-gray-500">
            ✅ {sessionStats.correct} • ❌ {sessionStats.incorrect}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span>Progress</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Flashcard */}
      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <Card className="min-h-[400px] cursor-pointer">
            <CardContent className="p-8 h-full flex items-center justify-center">
              <motion.div
                className="w-full text-center"
                onClick={() => setIsFlipped(!isFlipped)}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div style={{ backfaceVisibility: 'hidden' }}>
                  {!isFlipped ? (
                    <div>
                      <div className="text-sm text-gray-500 mb-4">Question</div>
                      <p className="text-lg leading-relaxed">{currentCard.front}</p>
                      <p className="text-sm text-gray-500 mt-6">Click to reveal answer</p>
                    </div>
                  ) : (
                    <div style={{ transform: 'rotateY(180deg)' }}>
                      <div className="text-sm text-gray-500 mb-4">Answer</div>
                      <p className="text-lg leading-relaxed">{currentCard.back}</p>
                      <p className="text-sm text-gray-500 mt-6">How did you do?</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center">
        <div className="flex items-center gap-4">
          {/* Navigation */}
          <Button
            variant="outline"
            onClick={goToPreviousCard}
            disabled={currentCardIndex === 0}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          {/* Reset Card */}
          <Button variant="outline" onClick={resetCard}>
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>

          {/* Response Buttons - Only show when flipped */}
          {isFlipped && (
            <>
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => handleCardResponse(false)}
              >
                <XCircle className="w-4 h-4 mr-2" />
                I missed it
              </Button>
              <Button
                variant="outline"
                className="border-green-200 text-green-600 hover:bg-green-50"
                onClick={() => handleCardResponse(true)}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                I got it
              </Button>
            </>
          )}

          {/* Next Card */}
          {!isFlipped && (
            <Button
              variant="outline"
              onClick={goToNextCard}
              disabled={currentCardIndex === flashcards.length - 1}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Study Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="text-center text-sm text-blue-700">
            <p className="font-medium mb-1">💡 Study Tip</p>
            <p>Take your time to think through each answer before flipping. Be honest about whether you truly knew it!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
