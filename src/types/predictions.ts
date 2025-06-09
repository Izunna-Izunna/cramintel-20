
// Type definitions for prediction data structures
export interface GeneratedQuestion {
  question: string;
  confidence?: number;
  reasoning?: string;
  type?: string;
  sources?: string[];
  difficulty?: string;
  marks?: number;
  formula?: string;
  constants?: string;
  instruction?: string;
  subtopics?: string[];
  hint?: string;
}

export interface ExamSection {
  title: string;
  questions: GeneratedQuestion[];
}

export interface ExamPaperStructure {
  exam_title: string;
  duration: string;
  instructions: string;
  sections: ExamSection[];
  total_marks?: number;
}

export interface PredictionResponse {
  predictions?: GeneratedQuestion[];
  overall_confidence?: number;
  analysis_summary?: string;
  // Exam paper format
  exam_title?: string;
  duration?: string;
  instructions?: string;
  sections?: ExamSection[];
  total_marks?: number;
}
