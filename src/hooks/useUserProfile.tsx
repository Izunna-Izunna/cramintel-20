
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Lecturer {
  name: string;
  course: string;
  style: string;
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
        setProfile({
          id: data.id,
          name: data.name || '',
          email: data.email || user.email || '',
          school: data.school || '',
          department: data.department || '',
          courses: data.courses || [],
          study_style: data.study_style || '',
          lecturers: data.lecturers || [],
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
