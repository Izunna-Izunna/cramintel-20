
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const recentUploads = [
  {
    name: "Data Structures Notes.pdf",
    type: "notes",
    icon: "📘",
    course: "CSC 202",
    uploadedAt: "2 hours ago",
    status: "processed"
  },
  {
    name: "Physics Past Question 2023.pdf",
    type: "past-question",
    icon: "📝",
    course: "PHY 101",
    uploadedAt: "1 day ago",
    status: "processed"
  },
  {
    name: "Thermodynamics Lecture.mp3",
    type: "whisper",
    icon: "🔊",
    course: "ENG 301",
    uploadedAt: "3 days ago",
    status: "processing"
  }
];

export function RecentUploads() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📂 Recent Uploads
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentUploads.map((upload, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{upload.icon}</span>
                <div>
                  <p className="font-medium text-sm">{upload.name}</p>
                  <p className="text-xs text-gray-500">{upload.course} • {upload.uploadedAt}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                {upload.status === 'processed' ? (
                  <>
                    <Button variant="ghost" size="sm">
                      Ask AI
                    </Button>
                    <Button variant="ghost" size="sm">
                      Generate Flashcards
                    </Button>
                  </>
                ) : (
                  <span className="text-xs text-yellow-600 px-2 py-1 bg-yellow-50 rounded">
                    Processing...
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <Button variant="outline" className="w-full mt-4">
          View All Uploads
        </Button>
      </CardContent>
    </Card>
  );
}
