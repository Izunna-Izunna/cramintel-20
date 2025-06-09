
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, Plus, Calendar, Target, TrendingUp, BookOpen, Eye } from 'lucide-react';
import { PredictionJourney } from './predictions/PredictionJourney';

interface Prediction {
  id: string;
  course: string;
  exam_date: string;
  confidence_score: number;
  questions_count: number;
  style: string;
  generated_at: string;
  status: 'active' | 'used' | 'expired';
}

export function PredictionsSection() {
  const [showJourney, setShowJourney] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);

  // Mock data - replace with actual data fetching
  const predictions: Prediction[] = [
    {
      id: '1',
      course: 'Physics 101',
      exam_date: '2024-02-15',
      confidence_score: 87,
      questions_count: 12,
      style: 'bullet',
      generated_at: '2024-01-28',
      status: 'active'
    },
    {
      id: '2',
      course: 'Mathematics 201',
      exam_date: '2024-02-20',
      confidence_score: 92,
      questions_count: 8,
      style: 'theory',
      generated_at: '2024-01-25',
      status: 'active'
    },
    {
      id: '3',
      course: 'Chemistry 150',
      exam_date: '2024-01-30',
      confidence_score: 78,
      questions_count: 15,
      style: 'mixed',
      generated_at: '2024-01-20',
      status: 'used'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'used': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 font-space mb-2">Exam Predictions</h2>
          <p className="text-gray-600">
            AI-powered predictions based on your study materials and past patterns.
          </p>
        </div>
        <Button 
          onClick={() => setShowJourney(true)}
          className="bg-gray-900 hover:bg-gray-800 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Generate New Prediction
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Predictions</p>
                <p className="text-xl font-bold">{predictions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg. Confidence</p>
                <p className="text-xl font-bold">
                  {Math.round(predictions.reduce((acc, p) => acc + p.confidence_score, 0) / predictions.length)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-xl font-bold">
                  {predictions.filter(p => p.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Questions</p>
                <p className="text-xl font-bold">
                  {predictions.reduce((acc, p) => acc + p.questions_count, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Predictions List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Recent Predictions</h3>
        {predictions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No predictions yet</h3>
              <p className="text-gray-600 mb-6">
                Generate your first AI-powered exam prediction based on your study materials.
              </p>
              <Button 
                onClick={() => setShowJourney(true)}
                className="bg-gray-900 hover:bg-gray-800"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Prediction
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {predictions.map((prediction) => (
              <Card key={prediction.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-800">{prediction.course}</h4>
                        <Badge className={getStatusColor(prediction.status)}>
                          {prediction.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {prediction.style}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span>Exam: {new Date(prediction.exam_date).toLocaleDateString()}</span>
                        <span>{prediction.questions_count} questions</span>
                        <span className={`font-medium ${getConfidenceColor(prediction.confidence_score)}`}>
                          {prediction.confidence_score}% confidence
                        </span>
                        <span>Generated {new Date(prediction.generated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedPrediction(prediction)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-gray-900 hover:bg-gray-800 text-white"
                      >
                        <BookOpen className="w-3 h-3 mr-1" />
                        Study
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Prediction Journey */}
      <Dialog open={showJourney} onOpenChange={setShowJourney}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate New Prediction</DialogTitle>
          </DialogHeader>
          <PredictionJourney />
        </DialogContent>
      </Dialog>
    </div>
  );
}
