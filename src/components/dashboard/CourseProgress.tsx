
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧭 Course Progress Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {courseProgress.map((course, index) => (
            <div key={index}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-sm">{course.course}</span>
                <span className="text-xs text-gray-500">
                  {course.uploaded}/{course.total} materials
                </span>
              </div>
              <Progress value={course.progress} className="h-2" />
              <p className="text-xs text-gray-600 mt-1">
                Add more to improve predictions
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
