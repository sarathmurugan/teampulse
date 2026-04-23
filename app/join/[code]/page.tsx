'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { QUESTIONS } from '@/lib/questions'

type Answer = { score: number; comment: string }

const defaultAnswers = (): Answer[] =>
  QUESTIONS.map(() => ({ score: 5, comment: '' }))

// -1 = framing slide, 0–N = questions
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
  }

  async function handleSubmit() {
    if (!session) return
    setSubmitting(true)
    setError('')

    const payload = {
      session_id: session.id,
      answers: answers.map((a, i) => ({
        question_index: i,
        score: a.score,
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
          <p className="text-2xl font-bold text-gray-800 mb-2">Session not found</p>
          <p className="text-gray-500 mb-6">This session may have closed or the code is incorrect.</p>
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
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Submitted!</h2>
          <p className="text-gray-500">Thank you — your responses have been recorded. The facilitator will display the results when everyone has responded.</p>
        </div>
      </main>
    )
  }

  // Framing slide
  if (currentQ === INTRO) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 max-w-lg mx-auto">
        <div className="w-full">
          <div className="mb-6 flex items-center justify-between">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-mono">{code}</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 leading-snug">
            Reflecting on the past couple of weeks...
          </h2>

          <p className="text-gray-600 mb-6 leading-relaxed">
            Please give an honest rating out of 10 on how strongly you feel you have been aligned to each of our team principles and behaviours.
          </p>

          <p className="text-sm font-semibold text-gray-700 mb-3">Try to think about:</p>
          <ul className="space-y-2 mb-8">
            <li className="flex gap-2 text-sm text-gray-600">
              <span className="text-brand-500 mt-0.5">•</span>
              Times when you have actively promoted and lived these principles in your own behaviour
            </li>
            <li className="flex gap-2 text-sm text-gray-600">
              <span className="text-brand-500 mt-0.5">•</span>
              When you may have influenced others to behave more positively
            </li>
            <li className="flex gap-2 text-sm text-gray-600">
              <span className="text-brand-500 mt-0.5">•</span>
              Any areas, on reflection, where you recognise that you could have improved
            </li>
          </ul>

          <div className="flex gap-4 mb-8 bg-warm-100 rounded-xl p-4">
            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-brand-600">10</p>
              <p className="text-xs text-gray-500 mt-0.5">Very strongly aligned</p>
            </div>
            <div className="w-px bg-warm-300" />
            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-gray-500">1</p>
              <p className="text-xs text-gray-500 mt-0.5">Very strongly misaligned</p>
            </div>
          </div>

          <button
            onClick={() => setCurrentQ(0)}
            className="w-full py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors"
          >
            Begin →
          </button>
        </div>
      </main>
    )
  }

  const progress = ((currentQ + 1) / QUESTIONS.length) * 100

  return (
    <main className="min-h-screen flex flex-col px-4 py-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-400 font-medium">Principle {currentQ + 1} of {QUESTIONS.length}</span>
          <span className="text-xs text-gray-400 uppercase tracking-wider font-mono">{code}</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full">
          <div
            className="h-1.5 bg-brand-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 leading-snug">
          {QUESTIONS[currentQ].title}
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          {QUESTIONS[currentQ].description}
        </p>

        {/* Score selector */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-gray-400 mb-3">
            <span>1 — Very strongly misaligned</span>
            <span>10 — Very strongly aligned</span>
          </div>

          {/* Dot selector */}
          <div className="flex gap-2 justify-between">
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <button
                key={n}
                onClick={() => setScore(n)}
                className={`flex-1 aspect-square rounded-lg font-semibold text-sm transition-all
                  ${answers[currentQ].score === n
                    ? 'bg-brand-500 text-white shadow-md scale-110'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-400 hover:text-brand-600'
                  }`}
              >
                {n}
              </button>
            ))}
          </div>

          <div className="mt-4 text-center">
            <span className="text-4xl font-bold text-brand-500">{answers[currentQ].score}</span>
            <span className="text-gray-400 text-sm ml-1">/ 10</span>
          </div>
        </div>

        {/* Comment */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Comment <span className="text-gray-400 font-normal">(optional, anonymous)</span>
          </label>
          <textarea
            value={answers[currentQ].comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Share any thoughts..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        {error && <p className="text-sm text-red-600 mb-4 text-center">{error}</p>}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={goPrev}
          disabled={currentQ === 0}
          className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Back
        </button>

        {currentQ < QUESTIONS.length - 1 ? (
          <button
            onClick={goNext}
            className="flex-2 flex-1 py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        )}
      </div>
    </main>
  )
}
