
-- Add fields to store mathematical formulas and variables in flashcards table
ALTER TABLE cramintel_flashcards 
ADD COLUMN formula text,
ADD COLUMN variables text,
ADD COLUMN math_category text;

-- Add index for better performance when filtering by math category
CREATE INDEX idx_flashcards_math_category ON cramintel_flashcards(math_category);
