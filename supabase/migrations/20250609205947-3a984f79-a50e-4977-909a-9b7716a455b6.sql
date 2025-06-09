
-- Create table to store extracted OCR text for reuse in predictions and AI chat
CREATE TABLE public.cramintel_extracted_texts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL,
  extracted_text TEXT NOT NULL,
  extraction_method TEXT NOT NULL DEFAULT 'ocr',
  extraction_confidence NUMERIC(5,2),
  word_count INTEGER,
  character_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Foreign key to materials table
  CONSTRAINT fk_extracted_texts_material 
    FOREIGN KEY (material_id) 
    REFERENCES public.cramintel_materials(id) 
    ON DELETE CASCADE,
    
  -- Ensure one extraction per material
  CONSTRAINT unique_material_extraction 
    UNIQUE (material_id)
);

-- Add Row Level Security
ALTER TABLE public.cramintel_extracted_texts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to ensure users can only access their own extracted texts
CREATE POLICY "Users can view their own extracted texts" 
  ON public.cramintel_extracted_texts 
  FOR SELECT 
  USING (
    material_id IN (
      SELECT id FROM public.cramintel_materials 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own extracted texts" 
  ON public.cramintel_extracted_texts 
  FOR INSERT 
  WITH CHECK (
    material_id IN (
      SELECT id FROM public.cramintel_materials 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own extracted texts" 
  ON public.cramintel_extracted_texts 
  FOR UPDATE 
  USING (
    material_id IN (
      SELECT id FROM public.cramintel_materials 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own extracted texts" 
  ON public.cramintel_extracted_texts 
  FOR DELETE 
  USING (
    material_id IN (
      SELECT id FROM public.cramintel_materials 
      WHERE user_id = auth.uid()
    )
  );

-- Create index for faster lookups
CREATE INDEX idx_extracted_texts_material_id ON public.cramintel_extracted_texts(material_id);
