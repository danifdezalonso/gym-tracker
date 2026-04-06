'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { WORKOUTS } from '@/lib/workouts'
import type { DayType } from '@/lib/types'

interface ChartPoint {
  date: string
  weight: number
  maxReps: number
}

const ALL_EXERCISES = (['push', 'pull', 'legs'] as DayType[]).flatMap((d) =>
  WORKOUTS[d].exercises.filter((e) => !e.isTime).map((e) => ({ name: e.name, day: WORKOUTS[d].name }))
)

const MONTH_ABBR = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
function shortDate(iso: string) {
  const d = new Date(iso + 'T12:00:00')
  return `${d.getDate()} ${MONTH_ABBR[d.getMonth()]}`
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-zinc-400 text-xs mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-white text-sm font-semibold">
          {p.name === 'weight' ? `${p.value} kg` : `${p.value} reps`}
        </p>
      ))}
    </div>
  )
}

export default function ProgressPage() {
  const [selectedExercise, setSelectedExercise] = useState(ALL_EXERCISES[0].name)
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [metric, setMetric] = useState<'weight' | 'reps'>('weight')

  useEffect(() => {
    async function load() {
      setLoading(true)

      const { data: sets } = await supabase
        .from('sets')
        .select('session_id, weight_kg, reps, created_at')
        .eq('exercise', selectedExercise)
        .eq('completed', true)
        .order('created_at')

      if (!sets || sets.length === 0) {
        setChartData([])
        setLoading(false)
        return
      }

      // Get session dates
      const sessionIds = [...new Set(sets.map((s) => s.session_id))]
      const { data: sessions } = await supabase
        .from('sessions')
        .select('id, date')
        .in('id', sessionIds)

      const dateMap: Record<string, string> = {}
      sessions?.forEach((s) => { dateMap[s.id] = s.date })

      // Group by session: max weight, max reps
      const grouped: Record<string, { weights: number[]; reps: number[] }> = {}
      sets.forEach((s) => {
        const sid = s.session_id
        if (!grouped[sid]) grouped[sid] = { weights: [], reps: [] }
        if (s.weight_kg != null) grouped[sid].weights.push(s.weight_kg)
        if (s.reps != null) grouped[sid].reps.push(s.reps)
      })

      const points: ChartPoint[] = Object.entries(grouped)
        .map(([sid, data]) => ({
          date: dateMap[sid] ?? '',
          weight: data.weights.length ? Math.max(...data.weights) : 0,
          maxReps: data.reps.length ? Math.max(...data.reps) : 0,
        }))
        .filter((p) => p.date)
        .sort((a, b) => a.date.localeCompare(b.date))

      setChartData(points)
      setLoading(false)
    }

    load()
  }, [selectedExercise])

  const hasData = chartData.length > 0
  const latest = chartData[chartData.length - 1]
  const prev = chartData[chartData.length - 2]
  const diff = latest && prev
    ? metric === 'weight'
      ? latest.weight - prev.weight
      : latest.maxReps - prev.maxReps
    : null

  return (
    <main className="min-h-screen bg-zinc-950 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-6">
        <Link href="/" className="p-2 -ml-2 text-zinc-400 active:text-white">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold">Progreso</h1>
      </div>

      {/* Exercise selector */}
      <div className="px-4 mb-6">
        <label className="block text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-2">Ejercicio</label>
        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="w-full h-12 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none"
        >
          {(['push', 'pull', 'legs'] as DayType[]).map((d) => (
            <optgroup key={d} label={WORKOUTS[d].name}>
              {WORKOUTS[d].exercises.filter((e) => !e.isTime).map((ex) => (
                <option key={ex.name} value={ex.name}>{ex.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Metric toggle */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900 rounded-xl">
          <button
            onClick={() => setMetric('weight')}
            className={`py-2 rounded-lg text-sm font-semibold transition-all ${metric === 'weight' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}
          >
            Peso máx. (kg)
          </button>
          <button
            onClick={() => setMetric('reps')}
            className={`py-2 rounded-lg text-sm font-semibold transition-all ${metric === 'reps' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}
          >
            Reps máx.
          </button>
        </div>
      </div>

      {/* Stats row */}
      {hasData && (
        <div className="px-4 mb-6 grid grid-cols-3 gap-3">
          <div className="bg-zinc-900 rounded-xl p-3">
            <p className="text-zinc-500 text-xs mb-1">Último</p>
            <p className="text-white font-bold">
              {metric === 'weight' ? `${latest.weight} kg` : `${latest.maxReps} reps`}
            </p>
          </div>
          <div className="bg-zinc-900 rounded-xl p-3">
            <p className="text-zinc-500 text-xs mb-1">Sesiones</p>
            <p className="text-white font-bold">{chartData.length}</p>
          </div>
          <div className="bg-zinc-900 rounded-xl p-3">
            <p className="text-zinc-500 text-xs mb-1">vs anterior</p>
            <p className={`font-bold ${diff == null ? 'text-zinc-600' : diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-zinc-400'}`}>
              {diff == null ? '—' : diff > 0 ? `+${diff}` : `${diff}`}
              {diff != null && (metric === 'weight' ? ' kg' : ' reps')}
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="px-4">
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !hasData ? (
            <div className="h-48 flex flex-col items-center justify-center text-center">
              <p className="text-zinc-500 text-sm">Sin datos aún</p>
              <p className="text-zinc-700 text-xs mt-1">Completa series para ver tu progreso</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="date"
                  tickFormatter={shortDate}
                  tick={{ fill: '#71717a', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#71717a', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey={metric === 'weight' ? 'weight' : 'maxReps'}
                  name={metric}
                  stroke="#f97316"
                  strokeWidth={2.5}
                  dot={{ fill: '#f97316', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#f97316' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </main>
  )
}
