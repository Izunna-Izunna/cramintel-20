
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Clock } from 'lucide-react';

export function PredictionsSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 font-space mb-2">AI Predictions</h2>
        <p className="text-gray-600">Likely exam questions based on your uploaded materials</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3, 4].map((prediction) => (
            <Card key={prediction} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    <CardTitle className="text-lg">High Probability Question #{prediction}</CardTitle>
                  </div>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    92% likely
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-3">
                  "Explain the process of cellular respiration and its role in ATP production..."
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Based on 3 sources
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Generated 2h ago
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
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
                    <span>45</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>High Confidence</span>
                    <span>23</span>
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
              <button className="w-full text-left p-2 rounded hover:bg-gray-50 transition-colors">
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
    </div>
  );
}
