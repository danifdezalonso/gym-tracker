'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { WORKOUTS, DAY_TYPE_COLORS, DAY_TYPE_BG } from '@/lib/workouts'
import type { Session, SetRecord, DayType } from '@/lib/types'

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTH_NAMES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
}

interface SessionWithSets extends Session {
  sets: SetRecord[]
  expanded: boolean
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionWithSets[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: sessionsData } = await supabase
        .from('sessions')
        .select('*')
        .order('date', { ascending: false })
        .limit(50)

      if (!sessionsData || sessionsData.length === 0) {
        setLoading(false)
        return
      }

      const ids = sessionsData.map((s: Session) => s.id)
      const { data: setsData } = await supabase
        .from('sets')
        .select('*')
        .in('session_id', ids)
        .eq('completed', true)
        .order('created_at')

      const allSets: SetRecord[] = setsData ?? []

      setSessions(
        sessionsData.map((s: Session) => ({
          ...s,
          sets: allSets.filter((r) => r.session_id === s.id),
          expanded: false,
        }))
      )
      setLoading(false)
    }
    load()
  }, [])

  function toggle(id: string) {
    setSessions((prev) => prev.map((s) => s.id === id ? { ...s, expanded: !s.expanded } : s))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-950 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-6">
        <Link href="/" className="p-2 -ml-2 text-zinc-400 active:text-white">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold">Historial</h1>
      </div>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-zinc-400 font-medium">Sin sesiones aún</p>
          <p className="text-zinc-600 text-sm mt-1">Tus entrenamientos aparecerán aquí</p>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {sessions.map((s) => {
            const workout = WORKOUTS[s.day_type as DayType]
            const color = DAY_TYPE_COLORS[s.day_type as DayType]
            const completedCount = s.sets.length
            const totalSets = workout.exercises.reduce((a, e) => a + e.sets, 0)

            return (
              <div key={s.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                {/* Session header */}
                <button
                  onClick={() => toggle(s.id)}
                  className="w-full flex items-center gap-4 p-4 active:bg-zinc-800 text-left"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${DAY_TYPE_BG[s.day_type as DayType]}`}>
                    <span className={`text-sm font-bold ${color}`}>
                      {s.day_type === 'push' ? 'P' : s.day_type === 'pull' ? 'J' : 'L'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{workout.name}</p>
                    <p className="text-zinc-500 text-sm">{formatDate(s.date)}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-zinc-400 text-sm font-mono">{completedCount}/{totalSets}</p>
                    <p className="text-zinc-600 text-xs">series</p>
                  </div>

                  <svg
                    className={`w-4 h-4 text-zinc-600 transition-transform shrink-0 ${s.expanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded: exercises + sets */}
                {s.expanded && (
                  <div className="px-4 pb-4 border-t border-zinc-800">
                    {workout.exercises.map((ex) => {
                      const exSets = s.sets.filter((r) => r.exercise === ex.name)
                      if (exSets.length === 0) return null
                      return (
                        <div key={ex.name} className="mt-3">
                          <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">{ex.name}</p>
                          <div className="space-y-1">
                            {exSets.map((r) => (
                              <div key={r.id} className="flex items-center gap-2">
                                <span className="text-zinc-600 text-xs w-4 font-mono">{r.set_number}</span>
                                <span className="text-zinc-300 text-sm font-mono">
                                  {ex.isTime
                                    ? `${r.reps ?? '—'}s`
                                    : `${r.weight_kg ?? '—'} kg × ${r.reps ?? '—'} reps`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}

                    <Link
                      href={`/workout/${s.id}`}
                      className="mt-4 flex items-center justify-center h-10 rounded-xl bg-zinc-800 text-zinc-300 text-sm font-medium active:bg-zinc-700"
                    >
                      Ver sesión completa
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
