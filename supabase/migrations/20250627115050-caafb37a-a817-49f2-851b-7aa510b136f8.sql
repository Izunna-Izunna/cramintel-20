
-- Add error_message column to cramintel_materials table to capture detailed error information
ALTER TABLE cramintel_materials 
ADD COLUMN error_message TEXT;

-- Add index for better performance when querying by processing status
CREATE INDEX IF NOT EXISTS idx_cramintel_materials_processing_status 
ON cramintel_materials(processing_status);

-- Add index for user_id and processing_status combination for dashboard queries
CREATE INDEX IF NOT EXISTS idx_cramintel_materials_user_processing 
ON cramintel_materials(user_id, processing_status);
