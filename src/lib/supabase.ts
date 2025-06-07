
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface CramIntelUser {
  id: string
  email: string
  password_hash: string
  name: string
  school: string
  department: string
  study_style: string
  first_action: string
  created_at: string
  updated_at: string
}

export interface CramIntelCourse {
  id: string
  user_id: string
  course_name: string
  created_at: string
}

export interface CramIntelUpload {
  id: string
  user_id: string
  file_name: string
  file_path: string
  file_type: string
  course: string
  material_type: string
  processed: boolean
  created_at: string
}

export interface CramIntelDeck {
  id: string
  user_id: string
  title: string
  description: string
  course: string
  source_file_id?: string
  format: string
  created_at: string
}

export interface CramIntelFlashcard {
  id: string
  user_id: string
  deck_id: string
  question: string
  answer: string
  mastered: boolean
  review_count: number
  created_at: string
}

export interface CramIntelProfile {
  id: string
  user_id: string
  study_streak: number
  total_study_time: number
  cards_mastered_total: number
  documents_uploaded: number
  ai_questions_asked: number
  last_study_date?: string
  achievements: any
  updated_at: string
}

export interface CramIntelChat {
  id: string
  user_id: string
  question: string
  answer: string
  context_files: any
  created_at: string
}

export interface CramIntelStudySession {
  id: string
  user_id: string
  deck_id: string
  cards_studied: number
  cards_mastered: number
  session_duration: number
  created_at: string
}
