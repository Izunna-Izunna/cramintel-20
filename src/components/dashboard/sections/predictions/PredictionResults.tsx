
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Download, Share2, BookOpen, Target, Calendar } from 'lucide-react';

interface Question {
  id: number;
  text: string;
  confidence: number;
  type: string;
  tags: string[];
}

interface Prediction {
  id: string;
  style: string;
  course: string;
  exam_date: string;
  confidence_score: number;
  questions: Question[];
  generated_at: string;
  materials_used: string[];
  tags_used: string[];
  exam_context: any;
}

interface PredictionResultsProps {
  prediction: Prediction;
  onBack: () => void;
  onStartNew: () => void;
}

export function PredictionResults({ prediction, onBack, onStartNew }: PredictionResultsProps) {
  if (!prediction) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No prediction data available.</p>
        <Button onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-100';
    if (confidence >= 75) return 'text-blue-600 bg-blue-100';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          <h3 className="text-2xl font-bold text-gray-800">Predictions Ready!</h3>
        </div>
        <p className="text-gray-600">
          Generated {prediction.questions.length} high-confidence predictions for {prediction.course}
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{prediction.confidence_score}%</div>
            <p className="text-sm text-gray-600">Overall Confidence</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{prediction.questions.length}</div>
            <p className="text-sm text-gray-600">Questions Generated</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{prediction.materials_used.length}</div>
            <p className="text-sm text-gray-600">Materials Analyzed</p>
          </CardContent>
        </Card>
      </div>

      {/* Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Predicted Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {prediction.questions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800 mb-2">
                    Question {index + 1}
                  </h4>
                  <p className="text-gray-700">{question.text}</p>
                </div>
                <Badge className={`ml-3 ${getConfidenceColor(question.confidence)}`}>
                  {question.confidence}% confident
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline">{question.type}</Badge>
                {question.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <Progress value={question.confidence} className="h-1" />
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Prediction Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Course:</span>
              <span className="ml-2 font-medium">{prediction.course}</span>
            </div>
            <div>
              <span className="text-gray-600">Style:</span>
              <span className="ml-2 font-medium capitalize">{prediction.style}</span>
            </div>
            {prediction.exam_date && (
              <div>
                <span className="text-gray-600">Exam Date:</span>
                <span className="ml-2 font-medium">{formatDate(prediction.exam_date)}</span>
              </div>
            )}
            <div>
              <span className="text-gray-600">Generated:</span>
              <span className="ml-2 font-medium">{formatDate(prediction.generated_at)}</span>
            </div>
          </div>
          
          <div>
            <p className="text-gray-600 text-sm mb-2">Tags Used:</p>
            <div className="flex flex-wrap gap-1">
              {prediction.tags_used.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Download PDF
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <Share2 className="w-4 h-4" />
          Share
        </Button>
        <Button onClick={onStartNew} className="bg-purple-600 hover:bg-purple-700">
          Generate New Prediction
        </Button>
      </div>

      <div className="flex justify-center pt-4">
        <Button variant="outline" onClick={onBack}>
          Back to Generation
        </Button>
      </div>
    </motion.div>
  );
}
