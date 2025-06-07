
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
    <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:shadow-lg transition-all duration-300">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-gray-800 font-space text-lg sm:text-xl">
          🃏 Flashcard of the Day
          <span className="text-xs sm:text-sm font-normal text-gray-600">from {flashcard.deck}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="relative h-40 sm:h-48 mb-4 md:mb-6">
          <motion.div
            className="absolute inset-0 bg-white rounded-xl shadow-sm border border-gray-200 cursor-pointer p-4 sm:p-6 flex items-center justify-center hover:shadow-md transition-shadow duration-300"
            whileHover={{ scale: 1.02 }}
            onClick={() => setIsFlipped(!isFlipped)}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6 }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div style={{ backfaceVisibility: 'hidden' }}>
              {!isFlipped ? (
                <div className="text-center">
                  <p className="text-sm sm:text-lg font-semibold mb-2 md:mb-3 text-gray-800">Question:</p>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{flashcard.question}</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-3 md:mt-4">Click to reveal answer</p>
                </div>
              ) : (
                <div className="text-center" style={{ transform: 'rotateY(180deg)' }}>
                  <p className="text-sm sm:text-lg font-semibold mb-2 md:mb-3 text-gray-700">Answer:</p>
                  <p className="text-xs sm:text-base text-gray-600 leading-relaxed">{flashcard.answer}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <span className="text-xs sm:text-sm text-gray-600 font-medium">{flashcard.subject}</span>
          <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50 text-xs sm:text-sm w-full sm:w-auto">
            Review more from this deck
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
