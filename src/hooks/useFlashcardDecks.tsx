
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface FlashcardDeck {
  id: string;
  name: string;
  description: string;
  course: string;
  format: string;
  tags: string[];
  source_materials: string[];
  total_cards: number;
  cards_mastered: number;
  study_streak: number;
  last_studied: string | null;
  created_at: string;
  updated_at: string;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  course: string;
  difficulty_level: string;
  mastery_level: number;
  times_reviewed: number;
  last_reviewed: string | null;
  next_review: string | null;
  created_at: string;
}

export const useFlashcardDecks = () => {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchDecks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cramintel_decks')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching decks:', error);
        toast({
          title: "Error",
          description: "Failed to load flashcard decks",
          variant: "destructive"
        });
        return;
      }

      setDecks(data || []);
    } catch (error) {
      console.error('Error fetching decks:', error);
      toast({
        title: "Error",
        description: "Failed to load flashcard decks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createDeck = async (deckData: Partial<FlashcardDeck>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('cramintel_decks')
        .insert({
          ...deckData,
          user_id: user.id,
          total_cards: 0,
          cards_mastered: 0,
          study_streak: 0
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating deck:', error);
        toast({
          title: "Error",
          description: "Failed to create deck",
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Success",
        description: "Deck created successfully",
      });

      await fetchDecks();
      return data;
    } catch (error) {
      console.error('Error creating deck:', error);
      toast({
        title: "Error",
        description: "Failed to create deck",
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteDeck = async (deckId: string) => {
    if (!user) return false;

    try {
      // First delete all flashcards associated with the deck
      const { error: flashcardsError } = await supabase
        .from('cramintel_deck_flashcards')
        .delete()
        .eq('deck_id', deckId);

      if (flashcardsError) {
        console.error('Error deleting deck flashcards:', flashcardsError);
        return false;
      }

      // Then delete the deck
      const { error } = await supabase
        .from('cramintel_decks')
        .delete()
        .eq('id', deckId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting deck:', error);
        toast({
          title: "Error",
          description: "Failed to delete deck",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Deck deleted successfully",
      });

      await fetchDecks();
      return true;
    } catch (error) {
      console.error('Error deleting deck:', error);
      toast({
        title: "Error",
        description: "Failed to delete deck",
        variant: "destructive"
      });
      return false;
    }
  };

  const updateDeckLastStudied = async (deckId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cramintel_decks')
        .update({ 
          last_studied: new Date().toISOString(),
          study_streak: supabase.sql`study_streak + 1`
        })
        .eq('id', deckId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating deck:', error);
      }
    } catch (error) {
      console.error('Error updating deck:', error);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, [user]);

  return {
    decks,
    loading,
    createDeck,
    deleteDeck,
    updateDeckLastStudied,
    refetchDecks: fetchDecks
  };
};

export const useFlashcards = (deckId: string) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFlashcards = async () => {
    if (!user || !deckId) return;

    try {
      const { data, error } = await supabase
        .from('cramintel_deck_flashcards')
        .select(`
          flashcard_id,
          cramintel_flashcards (
            id,
            question,
            answer,
            course,
            difficulty_level,
            mastery_level,
            times_reviewed,
            last_reviewed,
            next_review,
            created_at
          )
        `)
        .eq('deck_id', deckId);

      if (error) {
        console.error('Error fetching flashcards:', error);
        toast({
          title: "Error",
          description: "Failed to load flashcards",
          variant: "destructive"
        });
        return;
      }

      const flashcardsData = data?.map(item => item.cramintel_flashcards).filter(Boolean) || [];
      setFlashcards(flashcardsData as Flashcard[]);
    } catch (error) {
      console.error('Error fetching flashcards:', error);
      toast({
        title: "Error",
        description: "Failed to load flashcards",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFlashcardMastery = async (flashcardId: string, correct: boolean) => {
    if (!user) return;

    try {
      const flashcard = flashcards.find(f => f.id === flashcardId);
      if (!flashcard) return;

      const newMasteryLevel = correct 
        ? Math.min(flashcard.mastery_level + 1, 5)
        : Math.max(flashcard.mastery_level - 1, 0);

      const { error } = await supabase
        .from('cramintel_flashcards')
        .update({
          mastery_level: newMasteryLevel,
          times_reviewed: flashcard.times_reviewed + 1,
          last_reviewed: new Date().toISOString(),
          next_review: new Date(Date.now() + (newMasteryLevel * 24 * 60 * 60 * 1000)).toISOString()
        })
        .eq('id', flashcardId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating flashcard:', error);
        return;
      }

      // Update local state
      setFlashcards(prev => 
        prev.map(f => 
          f.id === flashcardId 
            ? { 
                ...f, 
                mastery_level: newMasteryLevel,
                times_reviewed: f.times_reviewed + 1,
                last_reviewed: new Date().toISOString()
              }
            : f
        )
      );
    } catch (error) {
      console.error('Error updating flashcard:', error);
    }
  };

  useEffect(() => {
    fetchFlashcards();
  }, [deckId, user]);

  return {
    flashcards,
    loading,
    updateFlashcardMastery,
    refetchFlashcards: fetchFlashcards
  };
};
