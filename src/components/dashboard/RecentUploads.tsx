
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
    <Card className="border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-gray-800 font-space">
          📂 Recent Uploads
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentUploads.map((upload, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all duration-300">
              <div className="flex items-center gap-4">
                <span className="text-2xl">{upload.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-gray-800">{upload.name}</p>
                  <p className="text-xs text-gray-600">{upload.course} • {upload.uploadedAt}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                {upload.status === 'processed' ? (
                  <>
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800 hover:bg-gray-100">
                      Ask AI
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800 hover:bg-gray-100">
                      Generate Flashcards
                    </Button>
                  </>
                ) : (
                  <span className="text-xs text-gray-600 px-3 py-2 bg-gray-100 rounded-lg">
                    Processing...
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <Button variant="outline" className="w-full mt-6 border-gray-300 text-gray-700 hover:bg-gray-50">
          View All Uploads
        </Button>
      </CardContent>
    </Card>
  );
}
