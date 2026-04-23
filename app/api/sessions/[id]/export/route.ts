import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isAdminAuthenticated } from '@/lib/auth'
import { QUESTIONS } from '@/lib/questions'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch session
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', params.id)
    .single()

  if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 500 })

  // Fetch all submissions and answers
  const { data: submissions, error: subError } = await supabase
    .from('submissions')
    .select('id, submitted_at, answers(question_index, score, comment)')
    .eq('session_id', params.id)
    .order('submitted_at', { ascending: true })

  if (subError) return NextResponse.json({ error: subError.message }, { status: 500 })

  const rows: string[] = [
    'Session ID,Session Code,Session Date,Submission ID,Submitted At,Question Index,Question Text,Score,Comment',
  ]

  for (const sub of submissions ?? []) {
    const answers = (sub.answers as { question_index: number; score: number; comment: string | null }[]) ?? []
    const sorted = [...answers].sort((a, b) => a.question_index - b.question_index)

    for (const ans of sorted) {
      const comment = ans.comment ? `"${ans.comment.replace(/"/g, '""')}"` : ''
      const question = `"${QUESTIONS[ans.question_index].title}"`
      rows.push(
        `${session.id},${session.code},${session.created_at},${sub.id},${sub.submitted_at},${ans.question_index + 1},${question},${ans.score},${comment}`
      )
    }
  }

  const csv = rows.join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="teampulse-session-${session.code}-${session.created_at.slice(0, 10)}.csv"`,
    },
  })
}
