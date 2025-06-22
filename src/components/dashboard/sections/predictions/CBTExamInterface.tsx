
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Moon, Sun, Users, Clock, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GeneratedQuestion } from '@/types/predictions';

interface CBTExamInterfaceProps {
  questions: GeneratedQuestion[];
  examTitle: string;
  timeLimit?: number; // in minutes
  onComplete: (answers: Record<number, string>, timeSpent: number) => void;
  onExit: () => void;
}

export function CBTExamInterface({ 
  questions, 
  examTitle, 
  timeLimit = 60, 
  onComplete, 
  onExit 
}: CBTExamInterfaceProps) {
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(timeLimit * 60); // Convert to seconds
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const totalQuestions = questions.length;
  const currentQuestionData = questions[currentQuestion - 1];

  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmitExam();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle answer selection
  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: answer
    }));
  };

  // Navigation functions
  const goToQuestion = (questionNum: number) => {
    setCurrentQuestion(questionNum);
    setSelectedAnswer(answers[questionNum] || '');
  };

  const goToPrevious = () => {
    if (currentQuestion > 1) {
      goToQuestion(currentQuestion - 1);
    }
  };

  const goToNext = () => {
    if (currentQuestion < totalQuestions) {
      goToQuestion(currentQuestion + 1);
    }
  };

  const handleSubmitExam = () => {
    const timeSpent = (timeLimit * 60) - timeLeft;
    onComplete(answers, timeSpent);
  };

  // Generate question numbers array
  const questionNumbers = Array.from({ length: totalQuestions }, (_, i) => i + 1);
  const answeredCount = Object.keys(answers).length;
  const progressPercentage = (currentQuestion / totalQuestions) * 100;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className="bg-gradient-to-r from-teal-600 to-blue-600 text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 rounded-full p-2">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-space-grotesk">CramIntel Mastery</h1>
              <p className="text-sm opacity-90">Computer Based Testing System</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-lg">
              <Clock className="w-4 h-4" />
              <span className="font-mono text-lg font-semibold">
                {formatTime(timeLeft)}
              </span>
            </div>
            <Button
              onClick={onExit}
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              Exit Exam
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        {/* Exam Info Bar */}
        <div className="mb-6">
          <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold font-space-grotesk">{examTitle}</h2>
                  <p className="text-sm text-gray-500">
                    {answeredCount} of {totalQuestions} questions answered
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Time Remaining</p>
                  <p className={`text-lg font-semibold ${timeLeft < 300 ? 'text-red-600' : 'text-gray-800 dark:text-white'}`}>
                    {formatTime(timeLeft)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Question Card */}
        <Card className={`${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white'} shadow-lg mb-6`}>
          <CardContent className="p-8">
            {/* Question Info */}
            <div className="mb-6">
              <p className="text-gray-500 text-sm mb-2">Question {currentQuestion} of {totalQuestions}</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                <div 
                  className="bg-gradient-to-r from-teal-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Question Text */}
            <h3 className="text-xl font-semibold mb-8 text-gray-800 dark:text-white font-space-grotesk leading-relaxed">
              {currentQuestionData?.question}
            </h3>

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQuestionData?.options?.map((option, index) => (
                <label
                  key={index}
                  className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    selectedAnswer === option
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                      : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="answer"
                    value={option}
                    checked={selectedAnswer === option}
                    onChange={() => handleAnswerSelect(option)}
                    className="w-4 h-4 text-teal-600 mt-1 mr-4 flex-shrink-0"
                  />
                  <span className="text-gray-700 dark:text-gray-200 leading-relaxed">{option}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mb-8">
          <Button
            onClick={goToPrevious}
            disabled={currentQuestion === 1}
            variant="outline"
            className="flex items-center px-6 py-3"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          <Button
            onClick={goToNext}
            disabled={currentQuestion === totalQuestions}
            className="flex items-center px-6 py-3 bg-teal-600 hover:bg-teal-700"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Question Number Grid */}
        <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
          <CardContent className="p-6">
            <h4 className="text-lg font-semibold mb-4 font-space-grotesk">Question Navigation</h4>
            <div className="grid grid-cols-10 gap-2 mb-6">
              {questionNumbers.map((num) => (
                <button
                  key={num}
                  onClick={() => goToQuestion(num)}
                  className={`w-10 h-10 rounded-lg font-medium transition-all duration-200 text-sm ${
                    num === currentQuestion
                      ? 'bg-teal-500 text-white shadow-lg'
                      : answers[num]
                      ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200 hover:bg-green-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <Button 
                onClick={() => setShowSubmitDialog(true)}
                className="px-8 py-3 bg-red-600 hover:bg-red-700 font-semibold"
              >
                Submit Exam
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Make sure to review all your answers before submitting
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Submit Confirmation Dialog */}
      {showSubmitDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Submit Exam?</h3>
              <p className="text-gray-600 mb-6">
                You have answered {answeredCount} out of {totalQuestions} questions. 
                Once submitted, you cannot make changes.
              </p>
              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowSubmitDialog(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Continue Exam
                </Button>
                <Button
                  onClick={handleSubmitExam}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Submit Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
