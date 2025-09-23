
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { shouldUseMockData, mockMaterials, mockMaterialGroups, mockDelay } from '@/services/mockDataService';

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
  group_id?: string;
  group_name?: string;
  processing_status?: string;
  processing_progress?: number;
  error_message?: string;
}

export interface MaterialGroup {
  group_id: string;
  group_name: string;
  materials: Material[];
  total_count: number;
  processed_count: number;
  upload_date: string;
}

export function useMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialGroups, setMaterialGroups] = useState<MaterialGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchMaterials = async () => {
    // Use mock data in demo mode
    if (shouldUseMockData()) {
      await mockDelay();
      setMaterials(mockMaterials);
      setMaterialGroups(mockMaterialGroups);
      setLoading(false);
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('cramintel_materials')
        .select('*')
        .eq('user_id', user.id)
        .order('upload_date', { ascending: false });

      if (error) {
        console.error('Error fetching materials:', error);
        return;
      }

      const allMaterials = data || [];
      setMaterials(allMaterials);

      // Group materials by group_id
      const grouped = allMaterials.reduce((groups: { [key: string]: Material[] }, material) => {
        const groupKey = material.group_id || material.id;
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(material);
        return groups;
      }, {});

      // Convert to MaterialGroup format
      const materialGroups: MaterialGroup[] = Object.entries(grouped).map(([groupKey, materials]) => {
        const firstMaterial = materials[0];
        return {
          group_id: groupKey,
          group_name: firstMaterial.group_name || firstMaterial.name,
          materials,
          total_count: materials.length,
          processed_count: materials.filter(m => m.processed).length,
          upload_date: firstMaterial.upload_date,
        };
      });

      setMaterialGroups(materialGroups);
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
    materialGroups,
    loading,
    fetchMaterials,
  };
}
