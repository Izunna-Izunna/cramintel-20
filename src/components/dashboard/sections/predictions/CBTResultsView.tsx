
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Target, Award, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GeneratedQuestion } from '@/types/predictions';
import CramIntelLogo from '@/components/CramIntelLogo';

interface CBTResultsViewProps {
  questions: GeneratedQuestion[];
  answers: Record<number, string>;
  timeSpent: number;
  examTitle: string;
  onRetakeExam: () => void;
  onBackToQuestions: () => void;
}

export function CBTResultsView({
  questions,
  answers,
  timeSpent,
  examTitle,
  onRetakeExam,
  onBackToQuestions
}: CBTResultsViewProps) {
  // Calculate results
  const totalQuestions = questions.length;
  const answeredQuestions = Object.keys(answers).length;
  const correctAnswers = questions.reduce((count, question, index) => {
    const questionNumber = index + 1;
    const userAnswer = answers[questionNumber];
    const correctAnswer = question.correct_answer;
    
    if (userAnswer && correctAnswer) {
      // Extract the letter from the correct answer if it's in format "A) Option text"
      const correctLetter = correctAnswer.charAt(0);
      const userLetter = userAnswer.charAt(0);
      return userLetter === correctLetter ? count + 1 : count;
    }
    return count;
  }, 0);

  const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const averageTimePerQuestion = timeSpent / totalQuestions;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeBg = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-50 border-green-200';
    if (percentage >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="min-h-screen bg-wrlds-light">
      {/* Header */}
      <header className="bg-gradient-to-r from-wrlds-dark to-gray-800 text-white px-6 py-8 border-b border-wrlds-accent/20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <div className="flex justify-center mb-4">
              <CramIntelLogo variant="light" size="md" />
            </div>
            <Award className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold font-space">Exam Complete!</h1>
            <p className="text-xl opacity-90 mt-2 font-space">{examTitle}</p>
          </motion.div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 -mt-8">
        {/* Overall Results Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className={`border-2 ${getGradeBg(percentage)} shadow-lg`}>
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-space">Your Score</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className={`text-6xl font-bold ${getGradeColor(percentage)} mb-4 font-space`}>
                {percentage}%
              </div>
              <p className="text-lg text-wrlds-accent mb-6 font-space">
                {correctAnswers} out of {totalQuestions} questions correct
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-wrlds-accent/20">
                  <Target className="w-8 h-8 text-wrlds-dark mx-auto mb-2" />
                  <p className="text-2xl font-bold text-wrlds-dark font-space">{correctAnswers}</p>
                  <p className="text-sm text-wrlds-accent font-space">Correct</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-wrlds-accent/20">
                  <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-wrlds-dark font-space">{totalQuestions - correctAnswers}</p>
                  <p className="text-sm text-wrlds-accent font-space">Incorrect</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-wrlds-accent/20">
                  <Clock className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-wrlds-dark font-space">{formatTime(timeSpent)}</p>
                  <p className="text-sm text-wrlds-accent font-space">Total Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detailed Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="shadow-lg border-wrlds-accent/20">
            <CardHeader>
              <CardTitle className="font-space text-wrlds-dark">Question Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {questions.map((question, index) => {
                  const questionNumber = index + 1;
                  const userAnswer = answers[questionNumber];
                  const correctAnswer = question.correct_answer;
                  const isCorrect = userAnswer && correctAnswer && 
                    userAnswer.charAt(0) === correctAnswer.charAt(0);
                  const wasAnswered = !!userAnswer;

                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        !wasAnswered 
                          ? 'border-wrlds-accent/30 bg-wrlds-light'
                          : isCorrect 
                            ? 'border-green-200 bg-green-50' 
                            : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-wrlds-dark flex-1 pr-4 font-space">
                          {questionNumber}. {question.question}
                        </h4>
                        <div className="flex items-center">
                          {!wasAnswered ? (
                            <span className="text-wrlds-accent text-sm font-space">Not answered</span>
                          ) : isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                      </div>
                      
                      {wasAnswered && (
                        <div className="text-sm space-y-1 font-space">
                          <p className="text-wrlds-accent">
                            <span className="font-medium">Your answer:</span> {userAnswer}
                          </p>
                          {!isCorrect && correctAnswer && (
                            <p className="text-green-600">
                              <span className="font-medium">Correct answer:</span> {
                                question.options?.find(opt => opt.charAt(0) === correctAnswer.charAt(0)) || correctAnswer
                              }
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            onClick={onRetakeExam}
            className="flex items-center px-6 py-3 bg-wrlds-dark hover:bg-gray-800 font-space"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Retake Exam
          </Button>
          <Button
            onClick={onBackToQuestions}
            variant="outline"
            className="flex items-center px-6 py-3 font-space border-wrlds-accent/40 hover:bg-wrlds-light"
          >
            Back to Questions
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
