'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError('')

    const res = await fetch(`/api/sessions-by-code/${code.trim().toUpperCase()}`)
    if (!res.ok) {
      setError('Room not found. Check the code and try again.')
      setLoading(false)
      return
    }

    const session = await res.json()
    if (session.status === 'closed') {
      setError('This session has already closed.')
      setLoading(false)
      return
    }

    router.push(`/join/${session.code}`)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-warm-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🤝</div>
          <h1 className="text-4xl font-semibold text-gray-900">TeamPulse</h1>
          <p className="mt-2 text-warm-500 text-base italic">Team sentiment, together.</p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Enter room code
            </label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. ABC123"
              maxLength={6}
              className="w-full px-4 py-3 rounded-xl border border-warm-200 bg-white text-center text-xl font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
              autoComplete="off"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full py-4 px-4 rounded-xl bg-brand-500 text-white font-semibold text-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Joining...' : 'Join Session'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <a href="/admin" className="text-xs text-warm-400 hover:text-warm-600 transition-colors">
            Facilitator login →
          </a>
        </div>
      </div>
    </main>
  )
}
