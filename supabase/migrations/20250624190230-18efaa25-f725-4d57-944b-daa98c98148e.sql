
-- First, let's create the storage bucket for materials if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cramintel-materials', 'cramintel-materials', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the cramintel-materials storage bucket
CREATE POLICY "Users can view their own material files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'cramintel-materials' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload their own material files" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'cramintel-materials' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own material files" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'cramintel-materials' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own material files" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'cramintel-materials' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add missing RLS policies for cramintel_study_analytics
CREATE POLICY "Users can view their own study analytics" 
ON public.cramintel_study_analytics FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study analytics" 
ON public.cramintel_study_analytics FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study analytics" 
ON public.cramintel_study_analytics FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study analytics" 
ON public.cramintel_study_analytics FOR DELETE 
USING (auth.uid() = user_id);

-- Add missing RLS policies for cramintel_flashcards
CREATE POLICY "Users can view their own flashcards" 
ON public.cramintel_flashcards FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own flashcards" 
ON public.cramintel_flashcards FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcards" 
ON public.cramintel_flashcards FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flashcards" 
ON public.cramintel_flashcards FOR DELETE 
USING (auth.uid() = user_id);

-- Enable RLS on tables if not already enabled
ALTER TABLE public.cramintel_study_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cramintel_flashcards ENABLE ROW LEVEL SECURITY;
