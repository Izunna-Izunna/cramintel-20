
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, RotateCcw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { GeneratedQuestion, PredictionStyle } from '@/types/predictions';

interface PredictionData {
  clues: Array<{
    id: string;
    name: string;
    type: 'past-questions' | 'assignment' | 'whisper';
    content?: string;
    materialId?: string;
  }>;
  context: {
    course: string;
    topics: string[];
    lecturer?: string;
  };
  style: PredictionStyle;
  generatedContent?: {
    predictions?: GeneratedQuestion[];
    overall_confidence?: number;
    analysis_summary?: string;
    material_coverage?: {
      topics_covered: string[];
      sections_analyzed: string[];
    };
  };
}

interface ObjectiveQuestionsViewProps {
  predictionData: PredictionData;
  onBack: () => void;
  onClose: () => void;
}

export function ObjectiveQuestionsView({ predictionData, onBack, onClose }: ObjectiveQuestionsViewProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showAnswers, setShowAnswers] = useState(false);
  const [quizMode, setQuizMode] = useState(false);

  const questions = predictionData.generatedContent?.predictions || [];

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    if (!showAnswers) {
      setSelectedAnswers(prev => ({
        ...prev,
        [questionIndex]: answer
      }));
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct_answer) {
        correct++;
      }
    });
    return Math.round((correct / questions.length) * 100);
  };

  const exportQuestions = () => {
    const content = questions.map((q, index) => {
      return `Question ${index + 1}: ${q.question}\n\n${q.options?.join('\n') || ''}\n\nCorrect Answer: ${q.correct_answer}\n\n${'-'.repeat(50)}\n\n`;
    }).join('');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${predictionData.context.course}_Objective_Questions.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetQuiz = () => {
    setSelectedAnswers({});
    setShowAnswers(false);
    setQuizMode(false);
  };

  const startQuizMode = () => {
    setQuizMode(true);
    resetQuiz();
  };

  if (questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Questions Generated</h3>
          <p className="text-gray-600 mb-6">
            We couldn't generate objective questions from your materials. Try uploading different materials or adjusting your selection.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Objective Questions - {predictionData.context.course}
          </h2>
          <p className="text-gray-600">
            {questions.length} questions generated • 
            Avg confidence: {Math.round(predictionData.generatedContent?.overall_confidence || 0)}%
          </p>
        </div>
        <div className="flex gap-2">
          {!quizMode && (
            <Button
              onClick={startQuizMode}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              <Clock className="w-4 h-4 mr-2" />
              Quiz Mode
            </Button>
          )}
          <Button variant="outline" onClick={exportQuestions}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Quiz Controls */}
      {quizMode && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="secondary">
                  Quiz Mode Active
                </Badge>
                <span className="text-sm text-gray-600">
                  {Object.keys(selectedAnswers).length} of {questions.length} answered
                </span>
              </div>
              <div className="flex gap-2">
                {Object.keys(selectedAnswers).length === questions.length && !showAnswers && (
                  <Button
                    onClick={() => setShowAnswers(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Show Results ({calculateScore()}%)
                  </Button>
                )}
                <Button variant="outline" onClick={resetQuiz}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((question, questionIndex) => (
          <motion.div
            key={questionIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: questionIndex * 0.1 }}
          >
            <Card className="overflow-hidden">
              <CardHeader className="bg-gray-50">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">
                    Question {questionIndex + 1}
                  </CardTitle>
                  <div className="flex gap-2">
                    {question.confidence && (
                      <Badge variant="secondary">
                        {Math.round(question.confidence)}% confidence
                      </Badge>
                    )}
                    {question.difficulty && (
                      <Badge variant={
                        question.difficulty === 'easy' ? 'default' :
                        question.difficulty === 'medium' ? 'secondary' : 'destructive'
                      }>
                        {question.difficulty}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-800 mb-4 leading-relaxed">
                  {question.question}
                </p>

                {question.options && (
                  <div className="space-y-3">
                    {question.options.map((option, optionIndex) => {
                      const isSelected = selectedAnswers[questionIndex] === option;
                      const isCorrect = option === question.correct_answer;
                      const showCorrectness = showAnswers && quizMode;
                      
                      let buttonClass = "w-full text-left p-4 rounded-lg border transition-all ";
                      
                      if (showCorrectness) {
                        if (isCorrect) {
                          buttonClass += "border-green-500 bg-green-50 text-green-800";
                        } else if (isSelected && !isCorrect) {
                          buttonClass += "border-red-500 bg-red-50 text-red-800";
                        } else {
                          buttonClass += "border-gray-200 bg-gray-50 text-gray-600";
                        }
                      } else if (isSelected) {
                        buttonClass += "border-teal-500 bg-teal-50 text-teal-800";
                      } else {
                        buttonClass += "border-gray-200 hover:border-gray-300 hover:bg-gray-50";
                      }

                      return (
                        <button
                          key={optionIndex}
                          onClick={() => handleAnswerSelect(questionIndex, option)}
                          className={buttonClass}
                          disabled={showAnswers && quizMode}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {showCorrectness && isCorrect && (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              )}
                              {showCorrectness && isSelected && !isCorrect && (
                                <XCircle className="w-5 h-5 text-red-600" />
                              )}
                              {!showCorrectness && (
                                <div className={`w-4 h-4 rounded-full border-2 ${
                                  isSelected ? 'border-teal-500 bg-teal-500' : 'border-gray-300'
                                }`} />
                              )}
                            </div>
                            <span className="flex-1">{option}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {!quizMode && question.correct_answer && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-800 mb-1">Correct Answer:</p>
                    <p className="text-green-700">{question.correct_answer}</p>
                  </div>
                )}

                {question.rationale && question.rationale.length > 0 && !quizMode && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-800 mb-2">Explanation:</p>
                    <div className="text-blue-700 text-sm space-y-1">
                      {question.rationale.map((point, idx) => (
                        <p key={idx}>• {point}</p>
                      ))}
                    </div>
                  </div>
                )}

                {question.topic && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-xs text-gray-500">Topic:</span>
                    <Badge variant="outline" className="text-xs">
                      {question.topic}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 flex justify-between items-center">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Style Selection
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={exportQuestions}>
            <Download className="w-4 h-4 mr-2" />
            Export Questions
          </Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
