
-- Add group_id column to materials table for grouping uploaded files
ALTER TABLE public.cramintel_materials 
ADD COLUMN group_id UUID DEFAULT NULL;

-- Add group_name column to store the name of the group
ALTER TABLE public.cramintel_materials 
ADD COLUMN group_name TEXT DEFAULT NULL;

-- Add index for better performance when querying by group
CREATE INDEX idx_materials_group_id ON public.cramintel_materials(group_id);

-- Add index for better performance when querying by user and processed status
CREATE INDEX idx_materials_user_processed ON public.cramintel_materials(user_id, processed);
