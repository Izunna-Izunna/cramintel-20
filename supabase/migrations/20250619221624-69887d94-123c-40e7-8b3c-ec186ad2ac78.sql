
-- Phase 1: Emergency RLS Removal - Remove ALL RLS policies and disable RLS

-- Disable RLS on all cramintel tables
ALTER TABLE public.cramintel_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cramintel_flashcards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cramintel_decks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cramintel_deck_flashcards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cramintel_extracted_texts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cramintel_study_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cramintel_study_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cramintel_user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cramintel_predictions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cramintel_chat_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cramintel_chat_messages DISABLE ROW LEVEL SECURITY;

-- Drop all existing RLS policies on cramintel tables
DROP POLICY IF EXISTS "Users can view their own materials" ON public.cramintel_materials;
DROP POLICY IF EXISTS "Users can insert their own materials" ON public.cramintel_materials;
DROP POLICY IF EXISTS "Users can update their own materials" ON public.cramintel_materials;
DROP POLICY IF EXISTS "Users can delete their own materials" ON public.cramintel_materials;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.cramintel_materials;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.cramintel_materials;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.cramintel_materials;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.cramintel_materials;

DROP POLICY IF EXISTS "Users can view their own flashcards" ON public.cramintel_flashcards;
DROP POLICY IF EXISTS "Users can insert their own flashcards" ON public.cramintel_flashcards;
DROP POLICY IF EXISTS "Users can update their own flashcards" ON public.cramintel_flashcards;
DROP POLICY IF EXISTS "Users can delete their own flashcards" ON public.cramintel_flashcards;

DROP POLICY IF EXISTS "Users can view their own decks" ON public.cramintel_decks;
DROP POLICY IF EXISTS "Users can insert their own decks" ON public.cramintel_decks;
DROP POLICY IF EXISTS "Users can update their own decks" ON public.cramintel_decks;
DROP POLICY IF EXISTS "Users can delete their own decks" ON public.cramintel_decks;

DROP POLICY IF EXISTS "Users can view their own deck flashcards" ON public.cramintel_deck_flashcards;
DROP POLICY IF EXISTS "Users can insert their own deck flashcards" ON public.cramintel_deck_flashcards;
DROP POLICY IF EXISTS "Users can update their own deck flashcards" ON public.cramintel_deck_flashcards;
DROP POLICY IF EXISTS "Users can delete their own deck flashcards" ON public.cramintel_deck_flashcards;

DROP POLICY IF EXISTS "Users can view their own extracted texts" ON public.cramintel_extracted_texts;
DROP POLICY IF EXISTS "Users can insert their own extracted texts" ON public.cramintel_extracted_texts;
DROP POLICY IF EXISTS "Users can update their own extracted texts" ON public.cramintel_extracted_texts;
DROP POLICY IF EXISTS "Users can delete their own extracted texts" ON public.cramintel_extracted_texts;

DROP POLICY IF EXISTS "Users can view their own study analytics" ON public.cramintel_study_analytics;
DROP POLICY IF EXISTS "Users can insert their own study analytics" ON public.cramintel_study_analytics;
DROP POLICY IF EXISTS "Users can update their own study analytics" ON public.cramintel_study_analytics;
DROP POLICY IF EXISTS "Users can delete their own study analytics" ON public.cramintel_study_analytics;

DROP POLICY IF EXISTS "Users can view their own study sessions" ON public.cramintel_study_sessions;
DROP POLICY IF EXISTS "Users can insert their own study sessions" ON public.cramintel_study_sessions;
DROP POLICY IF EXISTS "Users can update their own study sessions" ON public.cramintel_study_sessions;
DROP POLICY IF EXISTS "Users can delete their own study sessions" ON public.cramintel_study_sessions;

DROP POLICY IF EXISTS "Users can view their own profiles" ON public.cramintel_user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profiles" ON public.cramintel_user_profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.cramintel_user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profiles" ON public.cramintel_user_profiles;

DROP POLICY IF EXISTS "Users can view their own predictions" ON public.cramintel_predictions;
DROP POLICY IF EXISTS "Users can insert their own predictions" ON public.cramintel_predictions;
DROP POLICY IF EXISTS "Users can update their own predictions" ON public.cramintel_predictions;
DROP POLICY IF EXISTS "Users can delete their own predictions" ON public.cramintel_predictions;

DROP POLICY IF EXISTS "Users can view their own conversations" ON public.cramintel_chat_conversations;
DROP POLICY IF EXISTS "Users can insert their own conversations" ON public.cramintel_chat_conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.cramintel_chat_conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.cramintel_chat_conversations;

DROP POLICY IF EXISTS "Users can view their own messages" ON public.cramintel_chat_messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.cramintel_chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.cramintel_chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.cramintel_chat_messages;

-- Drop storage policies
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Enable read access for all users" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON storage.objects;
DROP POLICY IF EXISTS "Enable update for users based on owner" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete for users based on owner" ON storage.objects;

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cramintel-materials', 'cramintel-materials', true)
ON CONFLICT (id) DO NOTHING;
