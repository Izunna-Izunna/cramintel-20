
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, MessageSquare, BookOpen, CheckCircle, Share, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GeneratedQuestion, PredictionResponse } from '@/types/predictions';

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
  style: 'bullet' | 'theory' | 'mixed' | 'exam-paper';
  generatedContent?: PredictionResponse;
}

interface PredictionResultsProps {
  predictionData: PredictionData;
  onBack: () => void;
  onClose: () => void;
}

export function PredictionResults({ predictionData, onBack, onClose }: PredictionResultsProps) {
  console.log('PredictionResults received data:', predictionData);
  
  // Extract real predictions from the generated content
  const predictions = predictionData.generatedContent?.predictions || [];
  const overallConfidence = predictionData.generatedContent?.overall_confidence || 75;

  console.log('Extracted predictions:', predictions);
  console.log('Overall confidence:', overallConfidence);

  // Only use fallback if no real predictions are available
  const displayPredictions = predictions.length > 0 ? predictions : [
    {
      question: `No real predictions were generated. Please try again with different materials.`,
      confidence: 0,
      type: 'error',
      reasoning: 'Generation failed or returned empty results',
      sources: [],
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'theory':
        return <BookOpen className="w-4 h-4" />;
      case 'application':
      case 'applied':
        return <TrendingUp className="w-4 h-4" />;
      case 'calculation':
        return <Sparkles className="w-4 h-4" />;
      case 'error':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'theory':
        return 'Theory Question';
      case 'application':
      case 'applied':
        return 'Applied Problem';
      case 'calculation':
        return 'Calculation';
      case 'error':
        return 'Error';
      default:
        return 'Prediction';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'theory':
        return 'bg-blue-100 text-blue-700';
      case 'application':
      case 'applied':
        return 'bg-green-100 text-green-700';
      case 'calculation':
        return 'bg-purple-100 text-purple-700';
      case 'error':
        return 'bg-red-100 text-red-700';
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
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          {predictions.length > 0 ? 'Predictions Ready!' : 'Generation Issue'}
        </h3>
        <p className="text-gray-600">
          {predictions.length > 0 
            ? `Based on your ${predictionData.clues.length} uploaded materials for ${predictionData.context.course}`
            : 'There was an issue generating predictions from your materials'
          }
        </p>
      </motion.div>

      <div className="space-y-4 mb-8">
        {displayPredictions.map((prediction, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow border border-gray-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(prediction.type || 'prediction')}
                    <CardTitle className="text-lg">{getTypeLabel(prediction.type || 'prediction')}</CardTitle>
                  </div>
                  <Badge className={getTypeColor(prediction.type || 'prediction')}>
                    {prediction.confidence || 0}% likely
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4 text-base leading-relaxed">
                  "{prediction.question}"
                </p>
                
                {(prediction.sources || prediction.reasoning) && (
                  <div className="space-y-2 text-sm text-gray-600">
                    {prediction.sources && prediction.sources.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Sources:</span>
                        <span>{prediction.sources.join(', ')}</span>
                      </div>
                    )}
                    {prediction.reasoning && (
                      <div className="flex items-start gap-2">
                        <span className="font-medium">Rationale:</span>
                        <span>{prediction.reasoning}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {predictions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8"
        >
          <h4 className="font-semibold text-gray-800 mb-4">🧠 Actionable Follow-Ups:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" size="sm" className="justify-start border-gray-300 text-gray-700 hover:bg-gray-50">
              <BookOpen className="w-4 h-4 mr-2" />
              Generate Flashcards
            </Button>
            <Button variant="outline" size="sm" className="justify-start border-gray-300 text-gray-700 hover:bg-gray-50">
              <CheckCircle className="w-4 h-4 mr-2" />
              Save to Dashboard
            </Button>
            <Button variant="outline" size="sm" className="justify-start border-gray-300 text-gray-700 hover:bg-gray-50">
              <Share className="w-4 h-4 mr-2" />
              Share with Circle
            </Button>
            <Button variant="outline" size="sm" className="justify-start border-gray-300 text-gray-700 hover:bg-gray-50">
              <MessageSquare className="w-4 h-4 mr-2" />
              Ask AI to Explain
            </Button>
          </div>
        </motion.div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="border-gray-300 text-gray-700 hover:bg-gray-50">
          Generate Again
        </Button>
        <div className="flex gap-3">
          {predictions.length > 0 && (
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          )}
          <Button onClick={onClose} className="bg-gray-800 hover:bg-gray-900 text-white">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
