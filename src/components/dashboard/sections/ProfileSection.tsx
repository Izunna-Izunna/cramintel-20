
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Settings, Award, BookOpen, Plus, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  school: string;
  department: string;
  courses: string[];
  study_style: string;
  avatar_url?: string;
}

export function ProfileSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newCourse, setNewCourse] = useState('');
  const [isAddingCourse, setIsAddingCourse] = useState(false);

  // Study style options
  const studyStyles = ['Visual', 'Auditory', 'Reading/Writing', 'Kinesthetic'];

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cramintel_user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile({
          id: data.id,
          name: data.name || '',
          email: data.email || user.email || '',
          school: data.school || '',
          department: data.department || '',
          courses: data.courses || [],
          study_style: data.study_style || '',
          avatar_url: data.avatar_url
        });
      } else {
        // Create default profile if none exists
        setProfile({
          id: user.id,
          name: '',
          email: user.email || '',
          school: '',
          department: '',
          courses: [],
          study_style: ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    if (!profile) return;
    setProfile(prev => prev ? { ...prev, [field]: value } : null);
  };

  const addCourse = () => {
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

    setProfile(prev => prev ? {
      ...prev,
      courses: [...prev.courses, courseToAdd]
    } : null);
    setNewCourse('');
    setIsAddingCourse(false);
  };

  const removeCourse = (courseToRemove: string) => {
    if (!profile) return;
    setProfile(prev => prev ? {
      ...prev,
      courses: prev.courses.filter(course => course !== courseToRemove)
    } : null);
  };

  const selectStudyStyle = (style: string) => {
    if (!profile) return;
    setProfile(prev => prev ? { ...prev, study_style: style } : null);
  };

  const saveProfile = async () => {
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
          courses: profile.courses,
          study_style: profile.study_style,
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

  if (isLoading) {
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
                onClick={saveProfile}
                disabled={isSaving}
                className="bg-gray-800 hover:bg-gray-700"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
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
