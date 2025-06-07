import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, MessageSquare, BookOpen, CheckCircle, Share, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PredictionData {
  clues: Array<{
    id: string;
    name: string;
    type: 'past-questions' | 'assignment' | 'whisper';
    content?: string;
  }>;
  context: {
    course: string;
    topics: string[];
    lecturer?: string;
  };
  style: 'bullet' | 'theory' | 'mixed' | 'exam-paper';
}

interface PredictionResultsProps {
  predictionData: PredictionData;
  onBack: () => void;
  onClose: () => void;
}

export function PredictionResults({ predictionData, onBack, onClose }: PredictionResultsProps) {
  const predictions = [
    {
      id: 1,
      type: 'high-confidence',
      content: 'Define the Zeroth Law of Thermodynamics and explain its significance in temperature measurement',
      confidence: 95,
      sources: ['Past Questions - Week 6', 'Assignment - Binary Mixtures'],
      rationale: 'Appears in 4 out of 5 past papers, recently covered in assignment'
    },
    {
      id: 2,
      type: 'assignment-match',
      content: 'Calculate the efficiency of a Carnot cycle operating between two thermal reservoirs',
      confidence: 87,
      sources: ['Assignment - Binary Mixtures', 'Whisper - Focus on efficiency'],
      rationale: 'Matches assignment pattern and lecturer emphasis on efficiency calculations'
    },
    {
      id: 3,
      type: 'trending',
      content: 'Explain the difference between ideal and real gas behavior using PV diagrams',
      confidence: 78,
      sources: ['Whisper - Chapter 6 focus', 'Past Questions - Week 6'],
      rationale: 'Trending topic in study circles, mentioned by lecturer as important'
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'high-confidence':
        return <Sparkles className="w-4 h-4" />;
      case 'assignment-match':
        return <BookOpen className="w-4 h-4" />;
      case 'trending':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'high-confidence':
        return 'High Confidence';
      case 'assignment-match':
        return 'Assignment Match';
      case 'trending':
        return 'Trending in Study Circle';
      default:
        return 'Prediction';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'high-confidence':
        return 'bg-purple-100 text-purple-700';
      case 'assignment-match':
        return 'bg-green-100 text-green-700';
      case 'trending':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Predictions Ready!</h3>
        <p className="text-gray-600">
          Based on your {predictionData.clues.length} uploaded materials and context
        </p>
      </motion.div>

      <div className="space-y-4 mb-8">
        {predictions.map((prediction, index) => (
          <motion.div
            key={prediction.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(prediction.type)}
                    <CardTitle className="text-lg">{getTypeLabel(prediction.type)}</CardTitle>
                  </div>
                  <Badge className={getTypeColor(prediction.type)}>
                    {prediction.confidence}% likely
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4 text-base leading-relaxed">
                  "{prediction.content}"
                </p>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Sources:</span>
                    <span>{prediction.sources.join(', ')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium">Rationale:</span>
                    <span>{prediction.rationale}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8"
      >
        <h4 className="font-semibold text-gray-800 mb-4">🧠 Actionable Follow-Ups:</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button variant="outline" size="sm" className="justify-start">
            <BookOpen className="w-4 h-4 mr-2" />
            Generate Flashcards
          </Button>
          <Button variant="outline" size="sm" className="justify-start">
            <CheckCircle className="w-4 h-4 mr-2" />
            Save to Dashboard
          </Button>
          <Button variant="outline" size="sm" className="justify-start">
            <Share className="w-4 h-4 mr-2" />
            Share with Circle
          </Button>
          <Button variant="outline" size="sm" className="justify-start">
            <MessageSquare className="w-4 h-4 mr-2" />
            Ask AI to Explain
          </Button>
        </div>
      </motion.div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Generate Again
        </Button>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={onClose} className="bg-purple-600 hover:bg-purple-700">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
