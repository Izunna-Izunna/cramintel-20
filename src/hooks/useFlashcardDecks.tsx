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
      console.log('Fetching decks for user:', user.id);
      
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

      console.log('Successfully fetched decks:', data?.length || 0);
      setDecks(data || []);
    } catch (error) {
      console.error('Network error fetching decks:', error);
      toast({
        title: "Network Error",
        description: "Unable to connect to the server. Please check your internet connection.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createDeck = async (deckData: Partial<FlashcardDeck> & { name: string }) => {
    if (!user) {
      console.error('No user found when creating deck');
      return null;
    }

    console.log('Creating deck with data:', deckData);
    console.log('User ID:', user.id);

    // Retry logic for network failures
    const MAX_RETRIES = 3;
    let lastError: any = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Deck creation attempt ${attempt}/${MAX_RETRIES}`);
        
        // Test connection first
        const { data: connectionTest, error: connectionError } = await supabase
          .from('cramintel_decks')
          .select('count')
          .eq('user_id', user.id)
          .limit(1);

        if (connectionError) {
          console.error('Connection test failed:', connectionError);
          throw new Error(`Connection test failed: ${connectionError.message}`);
        }

        console.log('Connection test passed, proceeding with deck creation');

        const insertData = {
          name: deckData.name,
          description: deckData.description || '',
          course: deckData.course || '',
          format: deckData.format || 'Q&A',
          tags: deckData.tags || [],
          source_materials: deckData.source_materials || [],
          user_id: user.id,
          total_cards: 0,
          cards_mastered: 0,
          study_streak: 0
        };

        console.log('Insert data prepared:', insertData);

        const { data, error } = await supabase
          .from('cramintel_decks')
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error(`Database error on attempt ${attempt}:`, error);
          lastError = error;
          
          if (attempt === MAX_RETRIES) {
            throw new Error(`Database error after ${MAX_RETRIES} attempts: ${error.message}`);
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }

        console.log('Deck created successfully:', data);
        toast({
          title: "Success",
          description: "Deck created successfully",
        });

        await fetchDecks();
        return data;
      } catch (error: any) {
        console.error(`Error on attempt ${attempt}:`, error);
        lastError = error;
        
        if (attempt === MAX_RETRIES) {
          console.error('All retry attempts failed');
          toast({
            title: "Error",
            description: `Failed to create deck after ${MAX_RETRIES} attempts: ${error.message}`,
            variant: "destructive"
          });
          return null;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    return null;
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
      // Get current deck data first
      const { data: currentDeck } = await supabase
        .from('cramintel_decks')
        .select('study_streak')
        .eq('id', deckId)
        .eq('user_id', user.id)
        .single();

      const { error } = await supabase
        .from('cramintel_decks')
        .update({ 
          last_studied: new Date().toISOString(),
          study_streak: (currentDeck?.study_streak || 0) + 1
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
      console.log('🔍 Fetching flashcards for deck:', deckId);
      
      // First, let's try a direct query to see what's in the flashcards table
      const { data: directFlashcards, error: directError } = await supabase
        .from('cramintel_flashcards')
        .select('*')
        .eq('user_id', user.id);

      console.log('📊 Direct flashcards query result:', {
        count: directFlashcards?.length || 0,
        sample: directFlashcards?.[0],
        error: directError
      });

      // Now let's check the deck_flashcards junction table
      const { data: deckFlashcards, error: deckError } = await supabase
        .from('cramintel_deck_flashcards')
        .select('*')
        .eq('deck_id', deckId);

      console.log('🔗 Deck flashcards junction table:', {
        count: deckFlashcards?.length || 0,
        data: deckFlashcards,
        error: deckError
      });

      // Now the proper join query
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

      console.log('🃏 Joined flashcards query result:', {
        rawData: data,
        error: error,
        dataLength: data?.length || 0
      });

      if (error) {
        console.error('❌ Error fetching flashcards:', error);
        toast({
          title: "Error",
          description: "Failed to load flashcards",
          variant: "destructive"
        });
        return;
      }

      // Process the nested data structure
      const flashcardsData = data?.map((item: any) => {
        console.log('📋 Processing flashcard item:', item);
        return item.cramintel_flashcards;
      }).filter(Boolean) || [];

      console.log('✅ Processed flashcards data:', {
        count: flashcardsData.length,
        sample: flashcardsData[0],
        allCards: flashcardsData
      });

      setFlashcards(flashcardsData as Flashcard[]);
    } catch (error) {
      console.error('💥 Network error fetching flashcards:', error);
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
