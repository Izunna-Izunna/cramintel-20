import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Clock, Brain, Plus, Trash2 } from 'lucide-react';
import { PredictionJourney } from './predictions/PredictionJourney';
import { SavedPredictionView } from './predictions/SavedPredictionView';
import { usePredictions, Prediction } from '@/hooks/usePredictions';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function PredictionsSection() {
  const [showJourney, setShowJourney] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);
  const { predictions, loading, fetchPredictions } = usePredictions();
  const { toast } = useToast();

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hour${Math.floor(diffInHours) > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'exam-paper':
        return <Brain className="w-4 h-4" />;
      case 'bullet':
      case 'theory':
      case 'mixed':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'exam-paper':
        return 'Exam Paper';
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

  const handleDeletePrediction = async (predictionId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click from firing
    
    try {
      const { error } = await supabase
        .from('cramintel_predictions')
        .delete()
        .eq('id', predictionId);

      if (error) {
        throw error;
      }

      toast({
        title: "Prediction deleted",
        description: "The prediction has been successfully removed.",
      });

      // Refresh the predictions list
      await fetchPredictions();
    } catch (error) {
      console.error('Error deleting prediction:', error);
      toast({
        title: "Error",
        description: "Failed to delete the prediction. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 font-space mb-2">AI Predictions</h2>
            <p className="text-gray-600">Likely exam questions based on your uploaded materials</p>
          </div>
          <Skeleton className="h-12 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

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
            className="bg-gray-800 hover:bg-gray-900 text-white"
            size="lg"
          >
            <Brain className="w-5 h-5 mr-2" />
            Start Prediction Journey
          </Button>
        </div>

        {predictions.length === 0 ? (
          // Empty state
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Predictions Yet</h3>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                Upload your exam materials and let our AI predict what's likely to appear on your exam
              </p>
              <Button 
                onClick={() => setShowJourney(true)}
                className="bg-gray-800 hover:bg-gray-900 text-white"
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
              {predictions.map((prediction) => (
                <Card 
                  key={prediction.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer border border-gray-200 hover:border-gray-300"
                  onClick={() => setSelectedPrediction(prediction)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(prediction.prediction_type)}
                        <CardTitle className="text-lg">{getTypeLabel(prediction.prediction_type)}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                          {Math.round(prediction.confidence_score)}% likely
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeletePrediction(prediction.id, e)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-3">
                      <strong>{prediction.course}</strong> - {Array.isArray(prediction.questions) ? prediction.questions.length : 0} predictions generated
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {prediction.prediction_type === 'exam-paper' ? 'Full exam paper' : 'Question predictions'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Generated {formatTimeAgo(prediction.generated_at)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Card className="border-dashed border-2 border-gray-200 hover:border-gray-300 transition-colors cursor-pointer">
                <CardContent 
                  className="flex items-center justify-center py-8"
                  onClick={() => setShowJourney(true)}
                >
                  <div className="text-center">
                    <Plus className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-600 font-medium">Generate More Predictions</p>
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
                        <span>Average Confidence</span>
                        <span>{predictions.length > 0 ? Math.round(predictions.reduce((acc, p) => acc + p.confidence_score, 0) / predictions.length) : 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gray-800 h-2 rounded-full" 
                          style={{ 
                            width: `${predictions.length > 0 ? predictions.reduce((acc, p) => acc + p.confidence_score, 0) / predictions.length : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Total Predictions</span>
                        <span>{predictions.length}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>High Confidence</span>
                        <span>{predictions.filter(p => p.confidence_score > 85).length}</span>
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

      {selectedPrediction && (
        <SavedPredictionView 
          prediction={selectedPrediction} 
          onClose={() => setSelectedPrediction(null)} 
        />
      )}
    </>
  );
}
