
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
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-3 text-gray-800 font-space text-lg sm:text-xl">
          📂 Recent Uploads
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="space-y-3 md:space-y-4">
          {recentUploads.map((upload, index) => (
            <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all duration-300 gap-3">
              <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                <span className="text-xl md:text-2xl">{upload.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-xs sm:text-sm text-gray-800 truncate">{upload.name}</p>
                  <p className="text-[10px] sm:text-xs text-gray-600">{upload.course} • {upload.uploadedAt}</p>
                </div>
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                {upload.status === 'processed' ? (
                  <>
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 text-xs flex-1 sm:flex-none">
                      Ask AI
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 text-xs flex-1 sm:flex-none">
                      Generate Flashcards
                    </Button>
                  </>
                ) : (
                  <span className="text-[10px] sm:text-xs text-gray-600 px-2 md:px-3 py-1 md:py-2 bg-gray-100 rounded-lg">
                    Processing...
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <Button variant="outline" className="w-full mt-4 md:mt-6 border-gray-300 text-gray-700 hover:bg-gray-50 text-sm">
          View All Uploads
        </Button>
      </CardContent>
    </Card>
  );
}
