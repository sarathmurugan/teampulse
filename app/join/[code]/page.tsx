'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { QUESTIONS } from '@/lib/questions'

type Answer = { score: number; comment: string }

const defaultAnswers = (): Answer[] =>
  QUESTIONS.map(() => ({ score: 0, comment: '' }))

const INTRO = -1

export default function JoinPage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()

  const [session, setSession] = useState<{ id: string; status: string } | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [answers, setAnswers] = useState<Answer[]>(defaultAnswers())
  const [currentQ, setCurrentQ] = useState(INTRO)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/sessions-by-code/${code}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setNotFound(true); return }
        if (data.status === 'closed') { setNotFound(true); return }
        setSession(data)
      })
      .catch(() => setNotFound(true))
  }, [code])

  function setScore(value: number) {
    setAnswers(prev => {
      const next = [...prev]
      next[currentQ] = { ...next[currentQ], score: value }
      return next
    })
  }

  function setComment(value: string) {
    setAnswers(prev => {
      const next = [...prev]
      next[currentQ] = { ...next[currentQ], comment: value }
      return next
    })
  }

  function goNext() {
    if (currentQ < QUESTIONS.length - 1) setCurrentQ(q => q + 1)
  }

  function goPrev() {
    if (currentQ > 0) setCurrentQ(q => q - 1)
    else setCurrentQ(INTRO)
  }

  async function handleSubmit() {
    if (!session) return
    setSubmitting(true)
    setError('')

    const payload = {
      session_id: session.id,
      answers: answers.map((a, i) => ({
        question_index: i,
        score: a.score || 5,
        comment: a.comment,
      })),
    }

    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Something went wrong.')
      setSubmitting(false)
      return
    }

    setSubmitted(true)
  }

  if (notFound) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-2xl font-semibold text-gray-800 mb-2">Session not found</p>
          <p className="text-warm-600 mb-6">This session may have closed or the code is incorrect.</p>
          <button onClick={() => router.push('/')} className="text-brand-500 hover:underline text-sm">
            ← Back to home
          </button>
        </div>
      </main>
    )
  }

  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-warm-50">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🤝</div>
          <h2 className="text-3xl font-semibold text-gray-900 mb-3">Thank you!</h2>
          <p className="text-warm-600 leading-relaxed">Your responses have been recorded. The facilitator will display the results when everyone has responded.</p>
        </div>
      </main>
    )
  }

  // Framing slide
  if (currentQ === INTRO) {
    return (
      <main className="min-h-screen flex flex-col justify-center px-6 py-10 max-w-lg mx-auto bg-warm-50">
        <div className="w-full">
          <div className="mb-8 flex justify-between items-center">
            <span className="text-xs text-warm-400 uppercase tracking-widest font-medium">{code}</span>
          </div>

          <div className="text-4xl mb-5">🤝</div>

          <h2 className="text-3xl font-semibold text-gray-900 mb-4 leading-snug">
            Reflecting on the past couple of weeks...
          </h2>

          <p className="text-warm-700 mb-6 leading-relaxed text-lg">
            Please give an honest rating out of 10 on how strongly you feel you have been aligned to each of our team principles and behaviours.
          </p>

          <p className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Try to think about:</p>
          <ul className="space-y-3 mb-8">
            {[
              'Times when you have actively promoted and lived these principles in your own behaviour',
              'When you may have influenced others to behave more positively',
              'Any areas, on reflection, where you recognise that you could have improved',
            ].map((point, i) => (
              <li key={i} className="flex gap-3 text-warm-700 leading-snug">
                <span className="text-brand-400 mt-0.5 shrink-0">•</span>
                {point}
              </li>
            ))}
          </ul>

          <div className="flex gap-4 mb-8 bg-warm-100 border border-warm-200 rounded-2xl p-5">
            <div className="text-center flex-1">
              <p className="text-3xl font-semibold text-brand-500">10</p>
              <p className="text-xs text-warm-600 mt-1">Very strongly aligned</p>
            </div>
            <div className="w-px bg-warm-300" />
            <div className="text-center flex-1">
              <p className="text-3xl font-semibold text-warm-500">1</p>
              <p className="text-xs text-warm-600 mt-1">Very strongly misaligned</p>
            </div>
          </div>

          <button
            onClick={() => setCurrentQ(0)}
            className="w-full py-4 rounded-2xl bg-brand-500 text-white font-semibold text-lg hover:bg-brand-600 transition-colors"
          >
            Begin →
          </button>
        </div>
      </main>
    )
  }

  const progress = ((currentQ + 1) / QUESTIONS.length) * 100
  const currentScore = answers[currentQ].score
  const requiresComment = currentScore > 0 && currentScore <= 5
  const commentMissing = requiresComment && !answers[currentQ].comment.trim()

  return (
    <main className="min-h-screen flex flex-col px-5 py-8 max-w-lg mx-auto bg-warm-50">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-warm-500 font-medium">Principle {currentQ + 1} of {QUESTIONS.length}</span>
          <span className="text-xs text-warm-400 uppercase tracking-widest font-medium">{code}</span>
        </div>
        <div className="w-full h-1 bg-warm-200 rounded-full">
          <div
            className="h-1 bg-brand-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2 leading-snug">
          {QUESTIONS[currentQ].title}
        </h2>
        <p className="text-warm-600 leading-relaxed mb-8 text-base">
          {QUESTIONS[currentQ].description}
        </p>

        {/* Handshake score selector — 2 rows of 5 */}
        <div className="mb-3">
          <div className="grid grid-cols-5 gap-2 mb-2">
            {[1, 2, 3, 4, 5].map(n => (
              <HandshakeButton key={n} n={n} selected={currentScore === n} onSelect={setScore} />
            ))}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[6, 7, 8, 9, 10].map(n => (
              <HandshakeButton key={n} n={n} selected={currentScore === n} onSelect={setScore} />
            ))}
          </div>
        </div>

        <div className="flex justify-between text-xs text-warm-400 mb-6 px-1">
          <span>1 — Very strongly misaligned</span>
          <span>10 — Very strongly aligned</span>
        </div>

        {currentScore > 0 && (
          <div className="text-center mb-6">
            <span className="text-5xl font-semibold text-brand-500">{currentScore}</span>
            <span className="text-warm-400 text-lg ml-1">/ 10</span>
          </div>
        )}

        {/* Comment */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-warm-700 mb-2">
            Comment{' '}
            <span className="text-warm-400 font-normal">
              {requiresComment ? '(required for scores of 5 or below)' : '(optional, anonymous)'}
            </span>
          </label>
          <textarea
            value={answers[currentQ].comment}
            onChange={e => setComment(e.target.value)}
            placeholder={requiresComment ? 'Please share some context for your score...' : 'Share any thoughts...'}
            rows={3}
            className={`w-full px-4 py-3 rounded-xl border bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent placeholder:text-warm-300
              ${requiresComment && commentMissing ? 'border-brand-300' : 'border-warm-200'}`}
          />
          {requiresComment && commentMissing && (
            <p className="text-sm text-brand-500 mt-2">
              Please add a comment before continuing.
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-600 mb-4 text-center">{error}</p>}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={goPrev}
          className="flex-1 py-3 rounded-xl border border-warm-200 text-warm-600 font-medium hover:bg-warm-100 transition-colors"
        >
          Back
        </button>

        {currentQ < QUESTIONS.length - 1 ? (
          <button
            onClick={goNext}
            disabled={currentScore === 0 || commentMissing}
            className="flex-1 py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || currentScore === 0 || commentMissing}
            className="flex-1 py-3 rounded-xl bg-green-700 text-white font-semibold hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        )}
      </div>
    </main>
  )
}

function HandshakeButton({
  n,
  selected,
  onSelect,
}: {
  n: number
  selected: boolean
  onSelect: (n: number) => void
}) {
  return (
    <button
      onClick={() => onSelect(n)}
      className={`flex flex-col items-center justify-center py-3 rounded-xl border-2 transition-all active:scale-95
        ${selected
          ? 'border-brand-500 bg-brand-50 scale-105 shadow-md'
          : 'border-warm-200 bg-white hover:border-brand-300 hover:bg-warm-50'
        }`}
    >
      <span className={`text-2xl leading-none mb-1 transition-all ${selected ? 'grayscale-0' : 'grayscale opacity-40'}`}>
        🤝
      </span>
      <span className={`text-xs font-semibold ${selected ? 'text-brand-600' : 'text-warm-400'}`}>
        {n}
      </span>
    </button>
  )
}
