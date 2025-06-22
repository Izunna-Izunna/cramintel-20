
-- Add rationale and confidence fields to existing predictions table
ALTER TABLE cramintel_predictions 
ADD COLUMN rationale TEXT[],
ADD COLUMN confidence_level VARCHAR(20),
ADD COLUMN study_priority INTEGER;

-- Create new contextual insights table
CREATE TABLE prediction_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  prediction_session_id UUID REFERENCES cramintel_predictions(id),
  lecturer_emphasis TEXT,
  assignment_patterns TEXT,
  class_rumors TEXT,
  topic_emphasis TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on the new table
ALTER TABLE prediction_context ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for prediction_context
CREATE POLICY "Users can view their own prediction context" 
  ON prediction_context 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own prediction context" 
  ON prediction_context 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prediction context" 
  ON prediction_context 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prediction context" 
  ON prediction_context 
  FOR DELETE 
  USING (auth.uid() = user_id);
