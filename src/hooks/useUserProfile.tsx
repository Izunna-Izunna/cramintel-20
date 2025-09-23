
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { shouldUseMockData, mockUserProfile, mockDelay } from '@/services/mockDataService';

interface Lecturer {
  name: string;
  course: string;
  style: string;
  [key: string]: string; // Add index signature for Json compatibility
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  school: string;
  department: string;
  courses: string[];
  study_style: string;
  lecturers: Lecturer[];
  avatar_url?: string;
}

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Use mock data in demo mode
    if (shouldUseMockData()) {
      await mockDelay();
      setProfile(mockUserProfile);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const { data, error } = await supabase
        .from('cramintel_user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        // Parse lecturers data safely
        let lecturers: Lecturer[] = [];
        if (data.lecturers) {
          try {
            if (Array.isArray(data.lecturers)) {
              lecturers = data.lecturers as Lecturer[];
            } else if (typeof data.lecturers === 'string') {
              lecturers = JSON.parse(data.lecturers);
            }
          } catch (e) {
            console.error('Error parsing lecturers data:', e);
            lecturers = [];
          }
        }

        setProfile({
          id: data.id,
          name: data.name || '',
          email: data.email || user.email || '',
          school: data.school || '',
          department: data.department || '',
          courses: data.courses || [],
          study_style: data.study_style || '',
          lecturers: lecturers,
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
          study_style: '',
          lecturers: []
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
  };
}
