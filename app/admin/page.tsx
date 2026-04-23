'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Session } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type SessionWithCount = Session & { submission_count: number }

export default function AdminPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [sessions, setSessions] = useState<SessionWithCount[]>([])
  const [creating, setCreating] = useState(false)
  const [maxParticipants, setMaxParticipants] = useState(25)

  const fetchSessions = useCallback(async () => {
    const res = await fetch('/api/sessions')
    if (!res.ok) return
    const data: Session[] = await res.json()

    // Fetch submission counts
    const withCounts = await Promise.all(
      data.map(async s => {
        const { count } = await supabase
          .from('submissions')
          .select('id', { count: 'exact', head: true })
          .eq('session_id', s.id)
        return { ...s, submission_count: count ?? 0 }
      })
    )
    setSessions(withCounts)
  }, [])

  useEffect(() => {
    fetch('/api/auth/check')
      .then(r => r.json())
      .then(d => {
        setAuthed(d.authenticated)
        if (d.authenticated) fetchSessions()
      })
  }, [fetchSessions])

  // Real-time: watch for new submissions on open sessions
  useEffect(() => {
    if (!authed) return

    const channel = supabase
      .channel('admin-submissions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'submissions' }, () => {
        fetchSessions()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions' }, () => {
        fetchSessions()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [authed, fetchSessions])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (!res.ok) { setLoginError('Incorrect password'); return }
    setAuthed(true)
    fetchSessions()
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setAuthed(false)
    setSessions([])
  }

  async function createSession() {
    setCreating(true)
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ max_participants: maxParticipants }),
    })
    if (res.ok) await fetchSessions()
    setCreating(false)
  }

  async function closeSession(id: string) {
    await fetch(`/api/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'closed' }),
    })
    fetchSessions()
  }

  // Login screen
  if (authed === null) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Facilitator Login</h1>
            <p className="text-gray-500 text-sm mt-1">TeamPulse Admin</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Admin password"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              autoFocus
            />
            {loginError && <p className="text-sm text-red-600 text-center">{loginError}</p>}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </main>
    )
  }

  const openSessions = sessions.filter(s => s.status === 'open')
  const closedSessions = sessions.filter(s => s.status === 'closed')

  return (
    <main className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">TeamPulse</h1>
          <p className="text-gray-500 text-sm">Facilitator Dashboard</p>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
          Logout
        </button>
      </div>

      {/* Create Session */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">New Session</h2>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">Max participants</label>
            <input
              type="number"
              min={1}
              max={100}
              value={maxParticipants}
              onChange={e => setMaxParticipants(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>
          <button
            onClick={createSession}
            disabled={creating}
            className="px-6 py-2 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 disabled:opacity-50 transition-colors text-sm"
          >
            {creating ? 'Creating...' : '+ Create Session'}
          </button>
        </div>
      </div>

      {/* Open Sessions */}
      {openSessions.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">Live Sessions</h2>
          <div className="space-y-3">
            {openSessions.map(s => (
              <SessionCard
                key={s.id}
                session={s}
                onClose={() => closeSession(s.id)}
                onViewResults={() => router.push(`/results/${s.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Closed Sessions */}
      {closedSessions.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">Past Sessions</h2>
          <div className="space-y-3">
            {closedSessions.map(s => (
              <SessionCard
                key={s.id}
                session={s}
                onViewResults={() => router.push(`/results/${s.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium mb-1">No sessions yet</p>
          <p className="text-sm">Create a session above to get started.</p>
        </div>
      )}
    </main>
  )
}

function SessionCard({
  session,
  onClose,
  onViewResults,
}: {
  session: SessionWithCount
  onClose?: () => void
  onViewResults: () => void
}) {
  const isOpen = session.status === 'open'
  const joinUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${session.code}`
  const pct = Math.round((session.submission_count / session.max_participants) * 100)

  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(joinUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 ${isOpen ? 'border-brand-200' : 'border-gray-100'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-mono font-bold text-lg tracking-widest text-gray-800">{session.code}</span>
            {isOpen && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full">LIVE</span>
            )}
          </div>
          <p className="text-xs text-gray-400">
            {new Date(session.created_at).toLocaleString()}
          </p>
        </div>

        <div className="flex gap-2">
          {isOpen && (
            <button onClick={copy} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          )}
          <button
            onClick={onViewResults}
            className="text-xs px-3 py-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors"
          >
            Results
          </button>
          {isOpen && onClose && (
            <button
              onClick={onClose}
              className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{session.submission_count} of {session.max_participants} submitted</span>
          <span>{pct}%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${isOpen ? 'bg-brand-500' : 'bg-gray-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Export */}
      {!isOpen && (
        <div className="mt-3 pt-3 border-t border-gray-50">
          <a
            href={`/api/sessions/${session.id}/export`}
            className="text-xs text-brand-500 hover:underline"
          >
            Download CSV →
          </a>
        </div>
      )}
    </div>
  )
}
