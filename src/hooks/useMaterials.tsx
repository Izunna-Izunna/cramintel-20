
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Material {
  id: string;
  name: string;
  material_type: string;
  course: string;
  file_type: string;
  file_name: string;
  file_size: number;
  processed: boolean;
  upload_date: string;
  file_path?: string;
  extraction_method?: string;
  extraction_confidence?: number;
  extraction_metadata?: any;
  processing_status?: string;
  processing_progress?: number;
}

export function useMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchMaterials = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cramintel_materials')
        .select(`
          *,
          extraction_method,
          extraction_confidence,
          extraction_metadata,
          processing_status,
          processing_progress
        `)
        .eq('user_id', user.id)
        .eq('processed', true)
        .order('upload_date', { ascending: false });

      if (error) {
        console.error('Error fetching materials:', error);
        return;
      }

      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [user]);

  return {
    materials,
    loading,
    fetchMaterials,
  };
}
