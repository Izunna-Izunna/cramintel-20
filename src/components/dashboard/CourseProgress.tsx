
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const courseProgress = [
  { course: "CSC 202", uploaded: 2, total: 5, progress: 40 },
  { course: "PHY 101", uploaded: 4, total: 5, progress: 80 },
  { course: "ENG 301", uploaded: 1, total: 3, progress: 33 }
];

export function CourseProgress() {
  return (
    <Card className="border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-gray-800 font-space">
          🧭 Course Progress Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {courseProgress.map((course, index) => (
            <div key={index}>
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-sm text-gray-800">{course.course}</span>
                <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
                  {course.uploaded}/{course.total} materials
                </span>
              </div>
              <Progress value={course.progress} className="h-3 bg-gray-200" />
              <p className="text-xs text-gray-600 mt-2">
                Add more to improve predictions
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
