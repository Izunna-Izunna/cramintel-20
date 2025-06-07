
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const predictions = [
  {
    question: "Explain the concept of polymorphism in object-oriented programming",
    course: "CSC 202",
    source: "From assignments",
    confidence: 85,
    confidenceLevel: "high"
  },
  {
    question: "Derive the equation for simple harmonic motion",
    course: "PHY 101",
    source: "From class whispers",
    confidence: 72,
    confidenceLevel: "medium"
  },
  {
    question: "What are the three laws of thermodynamics?",
    course: "ENG 301",
    source: "From past questions",
    confidence: 91,
    confidenceLevel: "high"
  }
];

export function PredictionsFeed() {
  const [selectedCourse, setSelectedCourse] = useState('All');
  const courses = ['All', 'CSC 202', 'PHY 101', 'ENG 301'];

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
          {predictions.map((prediction, index) => (
            <div key={index} className="border border-gray-100 rounded-xl p-4 md:p-5 hover:bg-gray-50 transition-all duration-300 hover:shadow-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                <span className="text-xs sm:text-sm font-semibold text-gray-700 bg-gray-100 px-2 md:px-3 py-1 rounded-lg w-fit">
                  {prediction.course}
                </span>
                <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium w-fit ${getConfidenceColor(prediction.confidenceLevel)}`}>
                  {prediction.confidence}% confidence
                </span>
              </div>
              <p className="text-sm sm:text-base text-gray-800 mb-3 leading-relaxed">{prediction.question}</p>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs sm:text-sm text-gray-500 gap-2">
                <span>{prediction.source}</span>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 text-xs sm:text-sm p-1 sm:p-2">
                  Ask AI about this
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
