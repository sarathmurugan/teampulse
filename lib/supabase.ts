import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Session = {
  id: string
  code: string
  created_at: string
  closed_at: string | null
  max_participants: number
  status: 'open' | 'closed'
}

export type Submission = {
  id: string
  session_id: string
  submitted_at: string
  answers: Answer[]
}

export type Answer = {
  id: string
  submission_id: string
  question_index: number
  score: number
  comment: string | null
}

export type SessionWithCounts = Session & {
  submission_count: number
}
