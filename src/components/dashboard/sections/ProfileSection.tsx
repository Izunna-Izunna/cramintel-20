import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Settings, Award, BookOpen, Plus, X, GraduationCap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Lecturer {
  name: string;
  course: string;
  style: string;
  [key: string]: string;
}

export function ProfileSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { profile, loading, error, refetch } = useUserProfile();
  const [isSaving, setIsSaving] = useState(false);
  const [newCourse, setNewCourse] = useState('');
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  
  // Lecturer management states
  const [newLecturer, setNewLecturer] = useState<Lecturer>({ name: '', course: '', style: '' });
  const [isAddingLecturer, setIsAddingLecturer] = useState(false);

  // Study style options
  const studyStyles = ['Visual', 'Auditory', 'Reading/Writing', 'Kinesthetic'];
  
  // Lecturer style options
  const lecturerStyles = [
    'Theoretical',
    'Practical',
    'Interactive',
    'Traditional',
    'Problem-based',
    'Case Study',
    'Research-focused',
    'Exam-oriented'
  ];

  const handleInputChange = (field: keyof typeof profile, value: string) => {
    if (!profile) return;
    refetch(); // This will trigger a re-fetch which updates the profile state
  };

  const addCourse = async () => {
    if (!newCourse.trim() || !profile) return;
    
    const courseToAdd = newCourse.trim();
    if (profile.courses.includes(courseToAdd)) {
      toast({
        title: "Course already added",
        description: "This course is already in your list.",
        variant: "destructive"
      });
      return;
    }

    const updatedCourses = [...profile.courses, courseToAdd];
    
    try {
      const { error } = await supabase
        .from('cramintel_user_profiles')
        .update({ courses: updatedCourses })
        .eq('id', user?.id);

      if (error) throw error;

      setNewCourse('');
      setIsAddingCourse(false);
      refetch();
      
      toast({
        title: "Course added",
        description: "Course has been added to your profile.",
      });
    } catch (error) {
      console.error('Error adding course:', error);
      toast({
        title: "Error adding course",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  const removeCourse = async (courseToRemove: string) => {
    if (!profile) return;
    
    const updatedCourses = profile.courses.filter(course => course !== courseToRemove);
    
    try {
      const { error } = await supabase
        .from('cramintel_user_profiles')
        .update({ courses: updatedCourses })
        .eq('id', user?.id);

      if (error) throw error;

      refetch();
      
      toast({
        title: "Course removed",
        description: "Course has been removed from your profile.",
      });
    } catch (error) {
      console.error('Error removing course:', error);
      toast({
        title: "Error removing course",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  const addLecturer = async () => {
    if (!newLecturer.name.trim() || !newLecturer.course || !newLecturer.style || !profile) return;
    
    const lecturerToAdd = {
      name: newLecturer.name.trim(),
      course: newLecturer.course,
      style: newLecturer.style
    };

    // Check if lecturer already exists for this course
    if (profile.lecturers.some(l => l.name === lecturerToAdd.name && l.course === lecturerToAdd.course)) {
      toast({
        title: "Lecturer already added",
        description: "This lecturer is already added for this course.",
        variant: "destructive"
      });
      return;
    }

    const updatedLecturers = [...profile.lecturers, lecturerToAdd];
    
    try {
      const { error } = await supabase
        .from('cramintel_user_profiles')
        .update({ lecturers: updatedLecturers as any })
        .eq('id', user?.id);

      if (error) throw error;

      setNewLecturer({ name: '', course: '', style: '' });
      setIsAddingLecturer(false);
      refetch();
      
      toast({
        title: "Lecturer added",
        description: "Lecturer has been added to your profile.",
      });
    } catch (error) {
      console.error('Error adding lecturer:', error);
      toast({
        title: "Error adding lecturer",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  const removeLecturer = async (lecturerToRemove: Lecturer) => {
    if (!profile) return;
    
    const updatedLecturers = profile.lecturers.filter(
      l => !(l.name === lecturerToRemove.name && l.course === lecturerToRemove.course)
    );
    
    try {
      const { error } = await supabase
        .from('cramintel_user_profiles')
        .update({ lecturers: updatedLecturers as any })
        .eq('id', user?.id);

      if (error) throw error;

      refetch();
      
      toast({
        title: "Lecturer removed",
        description: "Lecturer has been removed from your profile.",
      });
    } catch (error) {
      console.error('Error removing lecturer:', error);
      toast({
        title: "Error removing lecturer",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  const selectStudyStyle = async (style: string) => {
    if (!profile) return;
    
    try {
      const { error } = await supabase
        .from('cramintel_user_profiles')
        .update({ study_style: style })
        .eq('id', user?.id);

      if (error) throw error;

      refetch();
      
      toast({
        title: "Study style updated",
        description: "Your study style preference has been saved.",
      });
    } catch (error) {
      console.error('Error updating study style:', error);
      toast({
        title: "Error updating study style",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  const saveBasicInfo = async () => {
    if (!profile || !user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('cramintel_user_profiles')
        .upsert({
          id: user.id,
          email: profile.email,
          name: profile.name,
          school: profile.school,
          department: profile.department,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving profile:', error);
        toast({
          title: "Error saving profile",
          description: "Please try again later.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Profile saved successfully!",
          description: "Your changes have been saved.",
        });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error saving profile",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Unable to load profile. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 font-space mb-2">Profile</h2>
        <p className="text-gray-600">Manage your account and study preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information Card */}
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
                  <Input 
                    id="name" 
                    value={profile.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={profile.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <Label htmlFor="school">School</Label>
                  <Input 
                    id="school" 
                    value={profile.school}
                    onChange={(e) => handleInputChange('school', e.target.value)}
                    placeholder="Enter your school"
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input 
                    id="department" 
                    value={profile.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    placeholder="Enter your department"
                  />
                </div>
              </div>
              <Button 
                onClick={saveBasicInfo}
                disabled={isSaving}
                className="bg-gray-800 hover:bg-gray-700"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>

          {/* Study Preferences Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Study Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label>Study Style</Label>
                  <p className="text-sm text-gray-600 mb-3">Your preferred learning method</p>
                  <div className="flex flex-wrap gap-2">
                    {studyStyles.map((style) => (
                      <Badge 
                        key={style}
                        variant={profile.study_style === style ? "default" : "secondary"}
                        className="cursor-pointer hover:bg-gray-200"
                        onClick={() => selectStudyStyle(style)}
                      >
                        {style}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label>Current Courses</Label>
                  <p className="text-sm text-gray-600 mb-3">Subjects you're currently studying</p>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {profile.courses.map((course) => (
                        <Badge 
                          key={course} 
                          variant="outline"
                          className="flex items-center gap-1 pr-1"
                        >
                          {course}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-4 w-4 p-0 hover:bg-red-100"
                            onClick={() => removeCourse(course)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    
                    {isAddingCourse ? (
                      <div className="flex gap-2">
                        <Input
                          value={newCourse}
                          onChange={(e) => setNewCourse(e.target.value)}
                          placeholder="Enter course name"
                          onKeyPress={(e) => e.key === 'Enter' && addCourse()}
                          className="flex-1"
                        />
                        <Button size="sm" onClick={addCourse}>Add</Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setIsAddingCourse(false);
                            setNewCourse('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsAddingCourse(true)}
                        className="flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Add Course
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Lecturers & Teaching Styles</Label>
                  <p className="text-sm text-gray-600 mb-3">Add your lecturers and their teaching styles for better predictions</p>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      {profile.lecturers.map((lecturer, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <GraduationCap className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="font-medium">{lecturer.name}</p>
                              <p className="text-sm text-gray-600">{lecturer.course} • {lecturer.style}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-red-100"
                            onClick={() => removeLecturer(lecturer)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    {isAddingLecturer ? (
                      <div className="space-y-3 p-4 border rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <Label htmlFor="lecturer-name">Lecturer Name</Label>
                            <Input
                              id="lecturer-name"
                              value={newLecturer.name}
                              onChange={(e) => setNewLecturer(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Dr. John Smith"
                            />
                          </div>
                          <div>
                            <Label htmlFor="lecturer-course">Course</Label>
                            <Select 
                              value={newLecturer.course} 
                              onValueChange={(value) => setNewLecturer(prev => ({ ...prev, course: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select course" />
                              </SelectTrigger>
                              <SelectContent>
                                {profile.courses.map(course => (
                                  <SelectItem key={course} value={course}>{course}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="lecturer-style">Teaching Style</Label>
                            <Select 
                              value={newLecturer.style} 
                              onValueChange={(value) => setNewLecturer(prev => ({ ...prev, style: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select style" />
                              </SelectTrigger>
                              <SelectContent>
                                {lecturerStyles.map(style => (
                                  <SelectItem key={style} value={style}>{style}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={addLecturer}>Add Lecturer</Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              setIsAddingLecturer(false);
                              setNewLecturer({ name: '', course: '', style: '' });
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsAddingLecturer(true)}
                        className="flex items-center gap-1"
                        disabled={profile.courses.length === 0}
                      >
                        <Plus className="w-4 h-4" />
                        Add Lecturer
                      </Button>
                    )}
                    
                    {profile.courses.length === 0 && (
                      <p className="text-sm text-gray-500 italic">
                        Add courses first before adding lecturers
                      </p>
                    )}
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
