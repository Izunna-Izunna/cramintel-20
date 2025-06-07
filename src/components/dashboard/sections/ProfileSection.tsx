
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Settings, Award, BookOpen } from 'lucide-react';

export function ProfileSection() {
  const userData = JSON.parse(localStorage.getItem('cramIntelUser') || '{}');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 font-space mb-2">Profile</h2>
        <p className="text-gray-600">Manage your account and study preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" defaultValue={userData.name || ''} />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="john.doe@example.com" />
                </div>
                <div>
                  <Label htmlFor="school">School</Label>
                  <Input id="school" defaultValue={userData.school || ''} />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" defaultValue={userData.department || ''} />
                </div>
              </div>
              <Button className="bg-gray-800 hover:bg-gray-700">Save Changes</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Study Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Study Style</Label>
                  <p className="text-sm text-gray-600 mb-2">Your preferred learning method</p>
                  <div className="flex flex-wrap gap-2">
                    {['Visual', 'Auditory', 'Reading/Writing', 'Kinesthetic'].map((style) => (
                      <Badge key={style} variant="secondary" className="cursor-pointer hover:bg-gray-200">
                        {style}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Current Courses</Label>
                  <p className="text-sm text-gray-600 mb-2">Subjects you're currently studying</p>
                  <div className="flex flex-wrap gap-2">
                    {(userData.courses || ['Biology', 'Chemistry']).map((course: string) => (
                      <Badge key={course} variant="outline">
                        {course}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    🏆
                  </div>
                  <div>
                    <p className="font-medium text-sm">Study Streak</p>
                    <p className="text-xs text-gray-500">7 days in a row</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    🧠
                  </div>
                  <div>
                    <p className="font-medium text-sm">Flashcard Master</p>
                    <p className="text-xs text-gray-500">100 cards reviewed</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    📚
                  </div>
                  <div>
                    <p className="font-medium text-sm">Material Uploader</p>
                    <p className="text-xs text-gray-500">5 documents uploaded</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Study Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Total Study Time</span>
                    <span className="font-semibold">42 hours</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Flashcards Mastered</span>
                    <span className="font-semibold">156</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Documents Uploaded</span>
                    <span className="font-semibold">8</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>AI Questions Asked</span>
                    <span className="font-semibold">23</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
