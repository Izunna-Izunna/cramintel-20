
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const predictions = [
  {
    question: "Explain the concept of polymorphism in object-oriented programming",
    course: "CSC 202",
    source: "From assignments",
    confidence: 85,
    color: "bg-green-100 text-green-800"
  },
  {
    question: "Derive the equation for simple harmonic motion",
    course: "PHY 101",
    source: "From class whispers",
    confidence: 72,
    color: "bg-yellow-100 text-yellow-800"
  },
  {
    question: "What are the three laws of thermodynamics?",
    course: "ENG 301",
    source: "From past questions",
    confidence: 91,
    color: "bg-green-100 text-green-800"
  }
];

export function PredictionsFeed() {
  const [selectedCourse, setSelectedCourse] = useState('All');
  const courses = ['All', 'CSC 202', 'PHY 101', 'ENG 301'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔮 Likely Exam Questions For You
        </CardTitle>
        <div className="flex gap-2 flex-wrap">
          {courses.map((course) => (
            <Button
              key={course}
              variant={selectedCourse === course ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCourse(course)}
            >
              {course}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {predictions.map((prediction, index) => (
            <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-blue-600">{prediction.course}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${prediction.color}`}>
                  {prediction.confidence}% confidence
                </span>
              </div>
              <p className="text-gray-800 mb-2">{prediction.question}</p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{prediction.source}</span>
                <Button variant="ghost" size="sm">
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
