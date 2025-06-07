
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export function FlashcardOfTheDay() {
  const [isFlipped, setIsFlipped] = useState(false);

  const flashcard = {
    question: "What is the primary function of the CPU in a computer system?",
    answer: "The CPU (Central Processing Unit) executes instructions, performs calculations, and manages data flow between different components of the computer system.",
    subject: "Computer Science",
    deck: "CSC 101 Fundamentals"
  };

  return (
    <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🃏 Flashcard of the Day
          <span className="text-sm font-normal text-gray-600">from {flashcard.deck}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-48 mb-4">
          <motion.div
            className="absolute inset-0 bg-white rounded-lg shadow-sm border cursor-pointer p-6 flex items-center justify-center"
            whileHover={{ scale: 1.02 }}
            onClick={() => setIsFlipped(!isFlipped)}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6 }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div style={{ backfaceVisibility: 'hidden' }}>
              {!isFlipped ? (
                <div className="text-center">
                  <p className="text-lg font-medium mb-2">Question:</p>
                  <p className="text-gray-700">{flashcard.question}</p>
                  <p className="text-sm text-gray-500 mt-4">Click to reveal answer</p>
                </div>
              ) : (
                <div className="text-center" style={{ transform: 'rotateY(180deg)' }}>
                  <p className="text-lg font-medium mb-2 text-green-600">Answer:</p>
                  <p className="text-gray-700">{flashcard.answer}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">{flashcard.subject}</span>
          <Button variant="outline" size="sm">
            Review more from this deck
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
