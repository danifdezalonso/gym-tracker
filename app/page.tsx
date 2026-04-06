'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { WORKOUTS, getTodayDayType, DAY_TYPE_COLORS, DAY_TYPE_BG } from '@/lib/workouts'
import type { DayType, Session } from '@/lib/types'

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTH_NAMES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function HomePage() {
  const router = useRouter()
  const todayDayType = getTodayDayType()

  const [selectedDay, setSelectedDay] = useState<DayType>(todayDayType ?? 'push')
  const [todaySession, setTodaySession] = useState<Session | null | undefined>(undefined)
  const [recentSessions, setRecentSessions] = useState<Session[]>([])
  const [starting, setStarting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const today = todayStr()

      const [sessionRes, recentRes] = await Promise.all([
        supabase
          .from('sessions')
          .select('*')
          .eq('date', today)
          .eq('day_type', selectedDay)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('sessions')
          .select('*')
          .order('date', { ascending: false })
          .limit(10),
      ])

      setTodaySession(sessionRes.data)
      setRecentSessions(recentRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [selectedDay])

  async function startWorkout() {
    setStarting(true)
    const today = todayStr()

    if (todaySession) {
      router.push(`/workout/${todaySession.id}`)
      return
    }

    const { data, error } = await supabase
      .from('sessions')
      .insert({ date: today, day_type: selectedDay })
      .select()
      .single()

    if (error || !data) {
      setStarting(false)
      alert('Error al crear sesión. Verifica tu conexión.')
      return
    }

    router.push(`/workout/${data.id}`)
  }

  const workout = WORKOUTS[selectedDay]
  const colorClass = DAY_TYPE_COLORS[selectedDay]
  const bgClass = DAY_TYPE_BG[selectedDay]

  return (
    <main className="min-h-screen bg-zinc-950 pb-8">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold tracking-tight">Gym Tracker</h1>
          <div className="flex gap-3">
            <Link href="/history" className="p-2 rounded-xl bg-zinc-800 text-zinc-400 active:bg-zinc-700">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Link>
            <Link href="/progress" className="p-2 rounded-xl bg-zinc-800 text-zinc-400 active:bg-zinc-700">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </Link>
          </div>
        </div>
        <p className="text-zinc-500 text-sm">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Day selector */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-3 gap-2 p-1 bg-zinc-900 rounded-2xl">
          {(['push', 'pull', 'legs'] as DayType[]).map((d) => {
            const isToday = d === todayDayType
            const isSelected = d === selectedDay
            return (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
                  isSelected
                    ? 'bg-zinc-700 text-white shadow-sm'
                    : 'text-zinc-500 active:bg-zinc-800'
                }`}
              >
                {WORKOUTS[d].name}
                {isToday && (
                  <span className="ml-1 text-[10px] text-orange-400">hoy</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Workout card */}
      <div className="px-4 mb-6">
        <div className={`rounded-2xl border p-5 ${bgClass}`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className={`text-2xl font-bold ${colorClass}`}>{workout.name}</h2>
              <p className="text-zinc-400 text-sm mt-0.5">{workout.subtitle}</p>
              <p className="text-zinc-500 text-xs mt-1">{workout.day}</p>
            </div>
            <span className={`text-4xl font-black opacity-20 ${colorClass}`}>
              {selectedDay === 'push' ? 'P' : selectedDay === 'pull' ? 'J' : 'L'}
            </span>
          </div>

          {/* Exercises list */}
          <div className="space-y-1.5 mb-5">
            {workout.exercises.map((ex) => (
              <div key={ex.name} className="flex items-center justify-between">
                <span className="text-zinc-300 text-sm">{ex.name}</span>
                <span className="text-zinc-500 text-xs font-mono">
                  {ex.sets}×{ex.repsRange}
                </span>
              </div>
            ))}
          </div>

          {/* CTA button */}
          {loading ? (
            <div className="h-14 rounded-xl bg-zinc-800/50 animate-pulse" />
          ) : (
            <button
              onClick={startWorkout}
              disabled={starting}
              className={`w-full h-14 rounded-xl font-bold text-base transition-all active:scale-95 disabled:opacity-60 ${
                todaySession
                  ? 'bg-zinc-700 text-white'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              {starting
                ? 'Cargando...'
                : todaySession
                ? 'Continuar Entrenamiento'
                : 'Iniciar Entrenamiento'}
            </button>
          )}
        </div>
      </div>

      {/* Rest day banner (if today is not a workout day and no override) */}
      {todayDayType === null && selectedDay === todayDayType && (
        <div className="px-4 mb-6">
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 text-center">
            <p className="text-zinc-400 text-sm">Hoy es día de descanso</p>
            <p className="text-zinc-600 text-xs mt-1">Usa el selector de arriba para entrenar de todos modos</p>
          </div>
        </div>
      )}

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <div className="px-4">
          <h3 className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-3">
            Sesiones recientes
          </h3>
          <div className="space-y-2">
            {recentSessions.map((s) => {
              const w = WORKOUTS[s.day_type as DayType]
              const color = DAY_TYPE_COLORS[s.day_type as DayType]
              return (
                <Link
                  key={s.id}
                  href={`/workout/${s.id}`}
                  className="flex items-center justify-between p-3.5 bg-zinc-900 rounded-xl border border-zinc-800 active:bg-zinc-800"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center`}>
                      <span className={`text-xs font-bold ${color}`}>
                        {s.day_type === 'push' ? 'P' : s.day_type === 'pull' ? 'J' : 'L'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{w.name}</p>
                      <p className="text-zinc-500 text-xs">{formatDate(s.date)}</p>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </main>
  )
}
