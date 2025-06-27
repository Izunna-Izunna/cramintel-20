
import { supabase } from '@/integrations/supabase/client';

// Function to check if essential RLS policies exist for study analytics
export async function ensureStudyAnalyticsAccess() {
  try {
    // Try to query study analytics to see if RLS policies allow access
    const { data, error } = await supabase
      .from('cramintel_study_analytics')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42501') {
      console.warn('RLS policies may be missing for study analytics');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking study analytics access:', error);
    return false;
  }
}

// Function to test material upload access
export async function testMaterialAccess() {
  try {
    const { data, error } = await supabase
      .from('cramintel_materials')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42501') {
      console.warn('RLS policies may be missing for materials');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking material access:', error);
    return false;
  }
}
