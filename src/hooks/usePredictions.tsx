
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Prediction {
  id: string;
  course: string;
  questions: any[];
  confidence_score: number;
  generated_at: string;
  status: string;
  prediction_type: string;
  exam_date?: string;
}

export function usePredictions() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPredictions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cramintel_predictions')
        .select('*')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false });

      if (error) {
        console.error('Error fetching predictions:', error);
        return;
      }

      setPredictions(data || []);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPrediction = async (predictionData: {
    course: string;
    questions: any[];
    confidence_score: number;
    prediction_type: string;
    exam_date?: string;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('cramintel_predictions')
        .insert({
          user_id: user.id,
          ...predictionData,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating prediction:', error);
        return null;
      }

      await fetchPredictions(); // Refresh the list
      return data;
    } catch (error) {
      console.error('Error creating prediction:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, [user]);

  return {
    predictions,
    loading,
    fetchPredictions,
    createPrediction,
  };
}
