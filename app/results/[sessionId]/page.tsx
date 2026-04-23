'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { QUESTIONS } from '@/lib/questions'

type AnswerRow = { question_index: number; score: number; comment: string | null }
type DrillDown = { questionIndex: number; scores: number[]; comments: string[] }

function avg(nums: number[]): number {
  if (!nums.length) return 0
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
}

function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = (score / 10) * 100
  const color =
    score >= 8 ? 'bg-green-500' : score >= 6 ? 'bg-brand-500' : score >= 4 ? 'bg-yellow-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-3 rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-bold text-gray-700 w-8 text-right">{score}</span>
    </div>
  )
}

function DistributionChart({ scores }: { scores: number[] }) {
  const counts = Array.from({ length: 10 }, (_, i) => scores.filter(s => s === i + 1).length)
  const maxCount = Math.max(...counts, 1)

  return (
    <div className="flex items-end gap-1 h-24">
      {counts.map((count, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div
            className="w-full rounded-t bg-brand-400 transition-all duration-500"
            style={{ height: `${(count / maxCount) * 80}px`, minHeight: count > 0 ? '4px' : '0' }}
          />
          <span className="text-xs text-gray-400">{i + 1}</span>
        </div>
      ))}
    </div>
  )
}

export default function ResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const router = useRouter()

  const [session, setSession] = useState<{ id: string; code: string; status: string; max_participants: number } | null>(null)
  const [answers, setAnswers] = useState<AnswerRow[]>([])
  const [submissionCount, setSubmissionCount] = useState(0)
  const [drillDown, setDrillDown] = useState<DrillDown | null>(null)
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)

  const loadData = useCallback(async () => {
    const [sessionRes, submissionsRes] = await Promise.all([
      supabase.from('sessions').select('*').eq('id', sessionId).single(),
      supabase.from('submissions').select('id, answers(question_index, score, comment)').eq('session_id', sessionId),
    ])

    if (sessionRes.data) setSession(sessionRes.data)
    if (submissionsRes.data) {
      setSubmissionCount(submissionsRes.data.length)
      const flat = submissionsRes.data.flatMap((s: { answers: AnswerRow[] }) => s.answers)
      setAnswers(flat)
    }
    setLoading(false)
  }, [sessionId])

  useEffect(() => {
    fetch('/api/auth/check').then(r => r.json()).then(d => setAuthed(d.authenticated))
    loadData()
  }, [loadData])

  // Real-time updates when session is open
  useEffect(() => {
    const channel = supabase
      .channel('results-' + sessionId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'submissions', filter: `session_id=eq.${sessionId}` }, () => {
        loadData()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` }, () => {
        loadData()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [sessionId, loadData])

  function openDrillDown(qi: number) {
    const qAnswers = answers.filter(a => a.question_index === qi)
    setDrillDown({
      questionIndex: qi,
      scores: qAnswers.map(a => a.score),
      comments: qAnswers.map(a => a.comment).filter(Boolean) as string[],
    })
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Session not found.</p>
      </main>
    )
  }

  const questionAverages = QUESTIONS.map((_, qi) => {
    const qScores = answers.filter(a => a.question_index === qi).map(a => a.score)
    return avg(qScores)
  })

  const overallAvg = avg(questionAverages.filter(a => a > 0))

  return (
    <main className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">Results</h1>
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${session.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {session.status === 'open' ? 'LIVE' : 'CLOSED'}
            </span>
          </div>
          <p className="text-gray-500 text-sm font-mono tracking-widest">{session.code}</p>
        </div>
        <div className="flex gap-2">
          {authed && (
            <button
              onClick={() => router.push('/admin')}
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              ← Dashboard
            </button>
          )}
          {authed && (
            <a
              href={`/api/sessions/${sessionId}/export`}
              className="text-sm px-3 py-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors"
            >
              Export CSV
            </a>
          )}
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-brand-600">{overallAvg || '—'}</p>
          <p className="text-xs text-gray-500 mt-1">Overall avg</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-gray-800">{submissionCount}</p>
          <p className="text-xs text-gray-500 mt-1">Submitted</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-gray-800">{session.max_participants}</p>
          <p className="text-xs text-gray-500 mt-1">Total expected</p>
        </div>
      </div>

      {/* Waiting state */}
      {submissionCount === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm">Waiting for responses...</p>
        </div>
      )}

      {/* Question results */}
      {submissionCount > 0 && (
        <div className="space-y-3">
          {QUESTIONS.map((q, qi) => {
            const qAvg = questionAverages[qi]
            return (
              <button
                key={qi}
                onClick={() => openDrillDown(qi)}
                className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left hover:border-brand-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3 gap-4">
                  <div className="flex gap-3">
                    <span className="text-xs font-bold text-gray-400 mt-0.5 w-5 shrink-0">Q{qi + 1}</span>
                    <p className="text-sm text-gray-700 leading-snug">{q.title}</p>
                  </div>
                  <span className="text-lg font-bold text-brand-600 shrink-0">{qAvg}</span>
                </div>
                <ScoreBar score={qAvg} max={10} />
              </button>
            )
          })}
        </div>
      )}

      {/* Drill-down modal */}
      {drillDown && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
          onClick={() => setDrillDown(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 pr-4">
                  <p className="text-xs font-bold text-gray-400 mb-1">Q{drillDown.questionIndex + 1}</p>
                  <h3 className="font-semibold text-gray-900 leading-snug">{QUESTIONS[drillDown.questionIndex].title}</h3>
                </div>
                <button onClick={() => setDrillDown(null)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
              </div>

              <div className="flex items-center gap-4 mb-4 bg-brand-50 rounded-xl p-4">
                <div className="text-4xl font-bold text-brand-600">{avg(drillDown.scores)}</div>
                <div className="text-sm text-gray-500">
                  Average from {drillDown.scores.length} response{drillDown.scores.length !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Score distribution</p>
                <DistributionChart scores={drillDown.scores} />
              </div>

              {drillDown.comments.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Comments ({drillDown.comments.length})
                  </p>
                  <div className="space-y-2">
                    {drillDown.comments.map((c, i) => (
                      <div key={i} className="bg-warm-50 rounded-xl px-4 py-3 text-sm text-gray-700 italic">
                        "{c}"
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {drillDown.comments.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No comments for this question.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
