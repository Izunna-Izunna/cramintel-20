
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { shouldUseMockData, mockPredictions, mockDelay } from '@/services/mockDataService';

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
    // Use mock data in demo mode
    if (shouldUseMockData()) {
      await mockDelay();
      setPredictions(mockPredictions);
      setLoading(false);
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

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

      // Transform the data to match our Prediction interface
      const transformedData: Prediction[] = (data || []).map(item => ({
        id: item.id,
        course: item.course,
        questions: Array.isArray(item.questions) ? item.questions : [],
        confidence_score: item.confidence_score || 0,
        generated_at: item.generated_at,
        status: item.status,
        prediction_type: item.prediction_type,
        exam_date: item.exam_date
      }));

      setPredictions(transformedData);
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

    // Use mock data in demo mode
    if (shouldUseMockData()) {
      await mockDelay();
      const newPrediction = {
        id: `pred-${Date.now()}`,
        ...predictionData,
        generated_at: new Date().toISOString(),
        status: 'completed'
      };
      setPredictions(prev => [newPrediction, ...prev]);
      return newPrediction;
    }

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
