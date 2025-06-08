
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePredictions } from '@/hooks/usePredictions';
import { Skeleton } from '@/components/ui/skeleton';

export function PredictionsFeed() {
  const { predictions, loading } = usePredictions();
  const [selectedCourse, setSelectedCourse] = useState('All');

  // Get unique courses from predictions
  const courses = ['All', ...Array.from(new Set(predictions.map(p => p.course)))];

  // Filter predictions by course
  const filteredPredictions = selectedCourse === 'All' 
    ? predictions 
    : predictions.filter(p => p.course === selectedCourse);

  const getConfidenceLevel = (score: number) => {
    if (score >= 85) return 'high';
    if (score >= 70) return 'medium';
    return 'low';
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-gray-700 text-white';
      case 'medium':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-300 text-gray-700';
    }
  };

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

  if (loading) {
    return (
      <Card className="border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-3 text-gray-800 font-space text-lg sm:text-xl mb-3 md:mb-0">
            🔮 Likely Exam Questions For You
          </CardTitle>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-3 md:space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-3 text-gray-800 font-space text-lg sm:text-xl mb-3 md:mb-0">
          🔮 Likely Exam Questions For You
        </CardTitle>
        <div className="flex gap-2 flex-wrap">
          {courses.map((course) => (
            <Button
              key={course}
              variant={selectedCourse === course ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCourse(course)}
              className={`text-xs sm:text-sm ${selectedCourse === course 
                ? "bg-gray-800 hover:bg-gray-700 text-white" 
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {course}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="space-y-3 md:space-y-4">
          {filteredPredictions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No predictions yet. Create your first prediction in the Predictions section!</p>
            </div>
          ) : (
            filteredPredictions.slice(0, 3).map((prediction) => {
              // Get first few questions from the prediction
              const questions = Array.isArray(prediction.questions) ? prediction.questions.slice(0, 2) : [];
              const confidenceLevel = getConfidenceLevel(prediction.confidence_score);
              
              return (
                <div key={prediction.id} className="border border-gray-100 rounded-xl p-4 md:p-5 hover:bg-gray-50 transition-all duration-300 hover:shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-gray-700 bg-gray-100 px-2 md:px-3 py-1 rounded-lg w-fit">
                      {prediction.course}
                    </span>
                    <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium w-fit ${getConfidenceColor(confidenceLevel)}`}>
                      {Math.round(prediction.confidence_score)}% confidence
                    </span>
                  </div>
                  
                  {questions.length > 0 ? (
                    <div className="mb-3">
                      {questions.map((question: any, index: number) => (
                        <p key={index} className="text-sm sm:text-base text-gray-800 mb-2 leading-relaxed">
                          {typeof question === 'string' ? question : question.question || 'Generated prediction'}
                        </p>
                      ))}
                      {prediction.questions.length > 2 && (
                        <p className="text-sm text-gray-500">
                          +{prediction.questions.length - 2} more predictions...
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm sm:text-base text-gray-800 mb-3 leading-relaxed">
                      {prediction.prediction_type === 'exam-paper' ? 'Full exam paper generated' : 'Custom predictions generated'}
                    </p>
                  )}
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs sm:text-sm text-gray-500 gap-2">
                    <span>Generated {formatTimeAgo(prediction.generated_at)}</span>
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 text-xs sm:text-sm p-1 sm:p-2">
                      View Details
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
