
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Prediction {
  id: string;
  course: string;
  examType: string;
  difficulty: string;
  predictions: string[];
  confidence: number;
}

interface PredictionResultsProps {
  prediction: Prediction;
  onBack: () => void;
  onStartNew: () => void;
}

export function PredictionResults({ prediction, onBack, onStartNew }: PredictionResultsProps) {
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Your Exam Prediction</span>
          <Badge variant="secondary">
            {prediction.confidence}% Confidence
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{prediction.course}</div>
            <div className="text-sm text-gray-600">Course</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{prediction.examType}</div>
            <div className="text-sm text-gray-600">Exam Type</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{prediction.difficulty}</div>
            <div className="text-sm text-gray-600">Difficulty</div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Predicted Questions & Topics:</h3>
          <div className="space-y-3">
            {prediction.predictions.map((pred, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800">{pred}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back to Generation
          </Button>
          <div className="space-x-2">
            <Button variant="outline">Save Prediction</Button>
            <Button onClick={onStartNew}>Create New Prediction</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
