import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Clock, Brain, Upload, Plus } from 'lucide-react';
import { PredictionJourney } from './predictions/PredictionJourney';

export function PredictionsSection() {
  const [showJourney, setShowJourney] = useState(false);

  // Sample recent predictions
  const recentPredictions = [
    {
      id: 1,
      question: "Explain the process of cellular respiration and its role in ATP production",
      confidence: 92,
      sources: 3,
      timeAgo: "2h ago",
      type: "high-confidence"
    },
    {
      id: 2,
      question: "Calculate the efficiency of a Carnot cycle operating between thermal reservoirs", 
      confidence: 87,
      sources: 2,
      timeAgo: "4h ago",
      type: "assignment-match"
    },
    {
      id: 3,
      question: "Define entropy and explain its significance in thermodynamic processes",
      confidence: 78,
      sources: 4,
      timeAgo: "6h ago", 
      type: "trending"
    }
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 font-space mb-2">AI Predictions</h2>
            <p className="text-gray-600">Likely exam questions based on your uploaded materials</p>
          </div>
          <Button 
            onClick={() => setShowJourney(true)}
            className="bg-purple-600 hover:bg-purple-700"
            size="lg"
          >
            <Brain className="w-5 h-5 mr-2" />
            Start Prediction Journey
          </Button>
        </div>

        {recentPredictions.length === 0 ? (
          // Empty state
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Predictions Yet</h3>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                Upload your exam materials and let our AI predict what's likely to appear on your exam
              </p>
              <Button 
                onClick={() => setShowJourney(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Create Your First Prediction
              </Button>
            </CardContent>
          </Card>
        ) : (
          // Existing predictions
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {recentPredictions.map((prediction) => (
                <Card key={prediction.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        <CardTitle className="text-lg">Predicted Question #{prediction.id}</CardTitle>
                      </div>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                        {prediction.confidence}% likely
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-3">
                      "{prediction.question}"
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        Based on {prediction.sources} sources
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Generated {prediction.timeAgo}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Card className="border-dashed border-2 border-purple-200 hover:border-purple-300 transition-colors cursor-pointer">
                <CardContent 
                  className="flex items-center justify-center py-8"
                  onClick={() => setShowJourney(true)}
                >
                  <div className="text-center">
                    <Plus className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-purple-600 font-medium">Generate More Predictions</p>
                    <p className="text-sm text-gray-500 mt-1">Add new materials for better accuracy</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Prediction Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Accuracy Rate</span>
                        <span>87%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '87%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Total Predictions</span>
                        <span>{recentPredictions.length}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>High Confidence</span>
                        <span>{recentPredictions.filter(p => p.confidence > 85).length}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <button 
                    onClick={() => setShowJourney(true)}
                    className="w-full text-left p-2 rounded hover:bg-gray-50 transition-colors"
                  >
                    📤 Upload more materials
                  </button>
                  <button className="w-full text-left p-2 rounded hover:bg-gray-50 transition-colors">
                    🧠 Generate flashcards
                  </button>
                  <button className="w-full text-left p-2 rounded hover:bg-gray-50 transition-colors">
                    📊 View detailed analysis
                  </button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {showJourney && (
        <PredictionJourney onClose={() => setShowJourney(false)} />
      )}
    </>
  );
}
