
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function DailyQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const questions = [
    {
      question: "What is the time complexity of binary search?",
      options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
      correct: 1
    },
    {
      question: "Which data structure uses LIFO principle?",
      options: ["Queue", "Stack", "Array", "Linked List"],
      correct: 1
    },
    {
      question: "What does CPU stand for?",
      options: ["Computer Processing Unit", "Central Processing Unit", "Central Program Unit", "Computer Program Unit"],
      correct: 1
    }
  ];

  const handleAnswer = (selectedIndex: number) => {
    if (selectedIndex === questions[currentQuestion].correct) {
      setScore(score + 1);
    }
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setShowResults(false);
  };

  return (
    <Card className="border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-3 text-gray-800 font-space text-lg sm:text-xl">
          🧪 Daily Quiz
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        {!showResults ? (
          <div>
            <div className="mb-4 md:mb-6">
              <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-2 md:mb-3">
                <span>Question {currentQuestion + 1} of {questions.length}</span>
                <span>Score: {score}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-700 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <h4 className="font-semibold mb-3 md:mb-4 text-gray-800 leading-relaxed text-sm sm:text-base">
              {questions[currentQuestion].question}
            </h4>
            
            <div className="space-y-2 md:space-y-3">
              {questions[currentQuestion].options.map((option, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full text-left justify-start border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-xs sm:text-sm p-3 h-auto"
                  onClick={() => handleAnswer(index)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-3xl md:text-4xl mb-3 md:mb-4">
              {score === questions.length ? '🎉' : score >= questions.length / 2 ? '👍' : '📚'}
            </div>
            <h4 className="font-semibold mb-2 md:mb-3 text-gray-800 text-sm sm:text-base">Quiz Complete!</h4>
            <p className="text-base sm:text-lg mb-3 md:mb-4 text-gray-700">
              You scored {score} out of {questions.length}
            </p>
            <Button onClick={resetQuiz} className="w-full bg-gray-800 hover:bg-gray-700 text-white text-sm">
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
