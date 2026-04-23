import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const { session_id, answers } = await request.json()

  if (!session_id || !Array.isArray(answers) || answers.length !== 10) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // Validate each answer
  for (const a of answers) {
    if (
      typeof a.question_index !== 'number' ||
      a.question_index < 0 || a.question_index > 9 ||
      typeof a.score !== 'number' ||
      a.score < 1 || a.score > 10
    ) {
      return NextResponse.json({ error: 'Invalid answer data' }, { status: 400 })
    }
  }

  // Check session is still open
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, status, max_participants')
    .eq('id', session_id)
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  if (session.status === 'closed') {
    return NextResponse.json({ error: 'Session is closed' }, { status: 409 })
  }

  // Check participant count hasn't exceeded max
  const { count } = await supabase
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', session_id)

  if ((count ?? 0) >= session.max_participants) {
    return NextResponse.json({ error: 'Session is full' }, { status: 409 })
  }

  // Insert submission
  const { data: submission, error: subError } = await supabase
    .from('submissions')
    .insert({ session_id })
    .select()
    .single()

  if (subError) return NextResponse.json({ error: subError.message }, { status: 500 })

  // Insert answers
  const answerRows = answers.map((a: { question_index: number; score: number; comment?: string }) => ({
    submission_id: submission.id,
    question_index: a.question_index,
    score: a.score,
    comment: a.comment?.trim() || null,
  }))

  const { error: ansError } = await supabase.from('answers').insert(answerRows)
  if (ansError) return NextResponse.json({ error: ansError.message }, { status: 500 })

  // Auto-close if all participants have now submitted
  const { count: newCount } = await supabase
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', session_id)

  if ((newCount ?? 0) >= session.max_participants) {
    await supabase
      .from('sessions')
      .update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('id', session_id)
  }

  return NextResponse.json({ ok: true, submission_id: submission.id }, { status: 201 })
}
