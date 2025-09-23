
// Type definitions for prediction data structures
export type PredictionStyle = 'bullet' | 'theory' | 'mixed' | 'exam-paper' | 'ranked' | 'practice_exam' | 'topic_based' | 'objective_bulk';

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
  rationale?: string[];
  confidence_level?: 'high' | 'medium' | 'low';
  study_priority?: number;
  // New fields for objective questions
  options?: string[];
  correct_answer?: string;
  topic?: string;
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
  study_guide?: {
    priority_1: string[];
    priority_2: string[];
    priority_3: string[];
  };
  // New fields for objective questions
  material_coverage?: {
    topics_covered: string[];
    sections_analyzed: string[];
  };
}

export interface PredictionContext {
  lecturer_emphasis?: string;
  assignment_patterns?: string;
  class_rumors?: string;
  topic_emphasis?: string[];
  assignment_focus?: 'calculations' | 'theory' | 'both';
  revision_hints?: string;
}

export interface MaterialCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  materials: string[];
}
