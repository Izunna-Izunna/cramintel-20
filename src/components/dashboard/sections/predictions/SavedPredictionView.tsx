
import React from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, TrendingUp, Download, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Prediction } from '@/hooks/usePredictions';
import { GeneratedQuestion, ExamSection } from '@/types/predictions';

interface SavedPredictionViewProps {
  prediction: Prediction;
  onClose: () => void;
}

export function SavedPredictionView({ prediction, onClose }: SavedPredictionViewProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'exam-paper':
        return 'Full Exam Paper';
      case 'bullet':
        return 'Quick Predictions';
      case 'theory':
        return 'Theory Questions';
      case 'mixed':
        return 'Mixed Format';
      default:
        return 'Prediction';
    }
  };

  // Enhanced parsing of questions data
  const parseQuestions = () => {
    if (!Array.isArray(prediction.questions)) {
      return [];
    }

    // Handle exam paper format (sections with questions)
    if (prediction.prediction_type === 'exam-paper') {
      const examData = prediction.questions[0]; // Exam paper structure is typically stored as first element
      
      if (examData && typeof examData === 'object' && 'sections' in examData) {
        const sections = examData.sections as ExamSection[];
        return sections.flatMap((section, sectionIndex) => 
          section.questions.map((question, questionIndex) => ({
            id: `${sectionIndex}-${questionIndex}`,
            content: question.question,
            type: question.type || 'theory',
            confidence: question.confidence,
            marks: question.marks,
            section: section.title
          }))
        );
      }
    }

    // Handle regular predictions format
    return prediction.questions.map((question: any, index: number) => {
      if (typeof question === 'string') {
        return {
          id: index.toString(),
          content: question,
          type: 'prediction',
          confidence: null
        };
      }

      if (typeof question === 'object') {
        return {
          id: index.toString(),
          content: question.question || question.content || 'Generated prediction',
          type: question.type || 'prediction',
          confidence: question.confidence,
          reasoning: question.reasoning,
          sources: question.sources,
          marks: question.marks
        };
      }

      return {
        id: index.toString(),
        content: 'Generated prediction',
        type: 'prediction',
        confidence: null
      };
    });
  };

  const parsedQuestions = parseQuestions();

  const renderQuestion = (question: any, index: number) => {
    return (
      <Card key={question.id || index} className="border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-800">
                {question.section ? `${question.section} - ` : ''}Question {index + 1}
              </h4>
              {question.marks && (
                <Badge variant="outline" className="text-xs">
                  {question.marks} marks
                </Badge>
              )}
            </div>
            {question.confidence && (
              <Badge variant="outline" className="text-xs">
                {question.confidence}% likely
              </Badge>
            )}
          </div>
          
          <p className="text-gray-700 leading-relaxed mb-3">
            {question.content}
          </p>
          
          {question.reasoning && (
            <p className="text-sm text-gray-500 italic">
              Rationale: {question.reasoning}
            </p>
          )}
          
          {question.sources && Array.isArray(question.sources) && (
            <p className="text-sm text-gray-500 mt-1">
              Sources: {question.sources.join(', ')}
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-auto"
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{getTypeLabel(prediction.prediction_type)}</h2>
            <p className="text-gray-600">{prediction.course}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Badge variant="secondary" className="bg-gray-100 text-gray-800">
              {Math.round(prediction.confidence_score)}% confidence
            </Badge>
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              Generated {formatDate(prediction.generated_at)}
            </span>
          </div>

          <div className="space-y-4 mb-8">
            {parsedQuestions.length > 0 ? (
              parsedQuestions.map((question, index) => renderQuestion(question, index))
            ) : (
              <Card className="border border-gray-200">
                <CardContent className="p-4 text-center">
                  <p className="text-gray-500">
                    {prediction.prediction_type === 'exam-paper' 
                      ? 'Exam paper content is not available for preview' 
                      : 'Prediction content could not be parsed'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
            <Button onClick={onClose} className="bg-gray-800 hover:bg-gray-900 text-white">
              Close
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
