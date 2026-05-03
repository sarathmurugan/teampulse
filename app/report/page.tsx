'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { QUESTIONS } from '@/lib/questions'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// One colour per principle + overall
const COLOURS = [
  '#c4622d', // brand orange
  '#7a5e46', // warm brown
  '#4a7c6f', // teal
  '#7c6fa8', // purple
  '#a87c4a', // gold
  '#6f8ca8', // slate blue
  '#1a1410', // near-black (overall)
]

function avg(nums: number[]): number {
  if (!nums.length) return 0
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
}

type ChartPoint = {
  date: string
  fullDate: string
  overall: number
  [key: string]: number | string
}

type AnswerRow = { question_index: number; score: number }

export default function ReportPage() {
  const router = useRouter()
  const [data, setData] = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      // Fetch all closed sessions ordered by date
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('id, created_at')
        .eq('status', 'closed')
        .order('created_at', { ascending: true })

      if (sessionsError || !sessions?.length) {
        setLoading(false)
        return
      }

      // Fetch all answers for each session
      const points: ChartPoint[] = await Promise.all(
        sessions.map(async session => {
          const { data: submissions } = await supabase
            .from('submissions')
            .select('answers(question_index, score)')
            .eq('session_id', session.id)

          const allAnswers: AnswerRow[] = (submissions ?? []).flatMap(
            (s: { answers: AnswerRow[] }) => s.answers
          )

          const date = new Date(session.created_at)
          const label = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

          const principleAvgs: Record<string, number> = {}
          QUESTIONS.forEach((_, qi) => {
            const scores = allAnswers.filter(a => a.question_index === qi).map(a => a.score)
            principleAvgs[`p${qi}`] = avg(scores)
          })

          const overallAvg = avg(Object.values(principleAvgs).filter(v => v > 0))

          return {
            date: label,
            fullDate: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
            overall: overallAvg,
            ...principleAvgs,
          }
        })
      )

      setData(points)
      setLoading(false)
    }

    load()
  }, [])

  function toggleLine(key: string) {
    setHidden(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const lines = [
    ...QUESTIONS.map((q, qi) => ({
      key: `p${qi}`,
      label: q.title.length > 28 ? q.title.slice(0, 26) + '…' : q.title,
      fullLabel: q.title,
      colour: COLOURS[qi],
      dashed: false,
    })),
    {
      key: 'overall',
      label: 'Overall average',
      fullLabel: 'Overall average',
      colour: COLOURS[6],
      dashed: true,
    },
  ]

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-warm-50">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-warm-50 px-4 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Team Report</h1>
          <p className="text-warm-500 text-sm italic mt-1">Pace Principles — score trends over time</p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="text-sm text-warm-400 hover:text-warm-700 transition-colors"
        >
          ← Home
        </button>
      </div>

      {data.length < 2 ? (
        <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-12 text-center">
          <div className="text-4xl mb-4">🤝</div>
          <p className="text-lg font-semibold text-gray-800 mb-2">Not enough data yet</p>
          <p className="text-warm-500 text-sm">Run at least two sessions to see trends appear here.</p>
        </div>
      ) : (
        <>
          {/* Toggle buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            {lines.map(line => (
              <button
                key={line.key}
                onClick={() => toggleLine(line.key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                  ${hidden.has(line.key)
                    ? 'border-warm-200 text-warm-400 bg-white'
                    : 'border-transparent text-white'
                  }`}
                style={hidden.has(line.key) ? {} : { backgroundColor: line.colour }}
              >
                <span
                  className={`inline-block w-3 h-0.5 ${line.dashed ? 'border-t-2 border-dashed' : ''}`}
                  style={line.dashed ? { borderColor: hidden.has(line.key) ? '#c4b08e' : 'white' } : { backgroundColor: hidden.has(line.key) ? '#c4b08e' : 'white' }}
                />
                {line.label}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-6 mb-8">
            <ResponsiveContainer width="100%" height={420}>
              <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ebe0cc" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#967558', fontFamily: 'Cormorant Garamond, serif' }}
                  tickLine={false}
                  axisLine={{ stroke: '#d9caaf' }}
                />
                <YAxis
                  domain={[0, 10]}
                  ticks={[0, 2, 4, 6, 8, 10]}
                  tick={{ fontSize: 12, fill: '#967558', fontFamily: 'Cormorant Garamond, serif' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#faf7f2',
                    border: '1px solid #ebe0cc',
                    borderRadius: '12px',
                    fontFamily: 'Cormorant Garamond, serif',
                    fontSize: '13px',
                  }}
                  formatter={(value: number, name: string) => {
                    const line = lines.find(l => l.key === name)
                    return [value, line?.fullLabel ?? name]
                  }}
                  labelFormatter={(label: string) => {
                    const point = data.find(d => d.date === label)
                    return point?.fullDate ?? label
                  }}
                />
                {lines.map(line => (
                  hidden.has(line.key) ? null : (
                    <Line
                      key={line.key}
                      type="monotone"
                      dataKey={line.key}
                      stroke={line.colour}
                      strokeWidth={line.dashed ? 2 : 2}
                      strokeDasharray={line.dashed ? '5 4' : undefined}
                      dot={{ r: 4, fill: line.colour, strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                      name={line.key}
                    />
                  )
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Per-session summary table */}
          <div className="bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-warm-100">
              <h2 className="font-semibold text-gray-800">Session averages</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-warm-100">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider">Date</th>
                    {QUESTIONS.map((q, qi) => (
                      <th key={qi} className="text-center px-3 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider whitespace-nowrap">
                        P{qi + 1}
                      </th>
                    ))}
                    <th className="text-center px-4 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider">Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((point, i) => (
                    <tr key={i} className="border-b border-warm-50 hover:bg-warm-50 transition-colors">
                      <td className="px-6 py-3 text-warm-700 font-medium">{point.fullDate}</td>
                      {QUESTIONS.map((_, qi) => {
                        const score = point[`p${qi}`] as number
                        return (
                          <td key={qi} className="text-center px-3 py-3">
                            <span className={`font-semibold ${score >= 7 ? 'text-green-700' : score >= 5 ? 'text-brand-500' : 'text-red-500'}`}>
                              {score || '—'}
                            </span>
                          </td>
                        )
                      })}
                      <td className="text-center px-4 py-3 font-bold text-gray-800">{point.overall}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Legend for P1–P6 */}
            <div className="px-6 py-4 border-t border-warm-100 flex flex-wrap gap-x-6 gap-y-1">
              {QUESTIONS.map((q, qi) => (
                <span key={qi} className="text-xs text-warm-500">
                  <span className="font-semibold text-warm-700">P{qi + 1}</span> — {q.title}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  )
}
