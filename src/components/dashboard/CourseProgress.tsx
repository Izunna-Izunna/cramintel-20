
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';

export function CourseProgress() {
  const { stats, loading } = useDashboardData();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (stats.coursesProgress.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Course Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No courses added yet</p>
            <p className="text-gray-400 text-xs mt-1">Add courses in your profile to track progress</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Course Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.coursesProgress.map((course, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">{course.name}</span>
              <span className="text-xs text-gray-500">
                {course.uploads}/{course.target} materials
              </span>
            </div>
            <Progress value={course.progress} className="h-2" />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {Math.round(course.progress)}% complete
              </span>
              {course.progress >= 100 && (
                <span className="text-xs text-green-600 font-medium">✓ Target reached!</span>
              )}
            </div>
          </div>
        ))}
        
        {stats.coursesProgress.length > 0 && (
          <div className="pt-3 border-t">
            <div className="text-xs text-gray-500 text-center">
              Overall: {Math.round(stats.coursesProgress.reduce((acc, course) => acc + course.progress, 0) / stats.coursesProgress.length)}% across all courses
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
