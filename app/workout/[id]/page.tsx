'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { WORKOUTS, DAY_TYPE_COLORS } from '@/lib/workouts'
import { playTimerEndSound } from '@/lib/audio'
import type { Session, SetRecord, DayType } from '@/lib/types'

interface RestTimerState {
  active: boolean
  seconds: number
  initialSeconds: number
  exerciseName: string
  setNumber: number
}

interface LocalSet {
  setNumber: number
  weight: string
  reps: string
  completed: boolean
  dbId?: string
}

const DEFAULT_REST_SECONDS = 90

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

function formatSeconds(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${pad(sec)}`
}

// ─── Rest Timer Overlay ───────────────────────────────────────────────────────

function RestTimerOverlay({
  timer,
  onSkip,
  onAdd30,
}: {
  timer: RestTimerState
  onSkip: () => void
  onAdd30: () => void
}) {
  const pct = timer.seconds / timer.initialSeconds
  const isWarning = timer.seconds <= 10
  const circumference = 2 * Math.PI * 54

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/95 flex flex-col items-center justify-center slide-up">
      <p className="text-zinc-500 text-sm mb-1">Descanso</p>
      <p className="text-zinc-300 text-base font-semibold mb-8">{timer.exerciseName} — Serie {timer.setNumber}</p>

      {/* Circular timer */}
      <div className="relative w-40 h-40 mb-8">
        <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" stroke="#27272a" strokeWidth="8" fill="none" />
          <circle
            cx="60" cy="60" r="54"
            stroke={isWarning ? '#ef4444' : '#f97316'}
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct)}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-4xl font-bold tabular-nums ${isWarning ? 'text-red-400 timer-warning' : 'text-white'}`}>
            {formatSeconds(timer.seconds)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        <button
          onClick={onSkip}
          className="px-6 py-3.5 bg-zinc-800 rounded-xl text-zinc-300 font-semibold text-sm active:bg-zinc-700"
        >
          Saltear
        </button>
        <button
          onClick={onAdd30}
          className="px-6 py-3.5 bg-zinc-800 rounded-xl text-zinc-300 font-semibold text-sm active:bg-zinc-700"
        >
          +30s
        </button>
      </div>
    </div>
  )
}

// ─── Set Row ─────────────────────────────────────────────────────────────────

function SetRow({
  setNumber,
  localSet,
  lastWeight,
  lastReps,
  isTime,
  onChange,
  onComplete,
}: {
  setNumber: number
  localSet: LocalSet
  lastWeight: string | null
  lastReps: string | null
  isTime?: boolean
  onChange: (field: 'weight' | 'reps', value: string) => void
  onComplete: () => void
}) {
  const done = localSet.completed

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
        done ? 'bg-zinc-900/50 opacity-60' : 'bg-zinc-900'
      }`}
    >
      {/* Set number */}
      <span className="w-6 text-center text-zinc-500 font-mono text-sm shrink-0">{setNumber}</span>

      {/* Last session hint */}
      <div className="w-16 shrink-0">
        {lastWeight || lastReps ? (
          <p className="text-xs text-zinc-600 leading-tight text-center">
            {isTime ? `${lastReps}s` : `${lastWeight ?? '—'}×${lastReps ?? '—'}`}
          </p>
        ) : (
          <p className="text-xs text-zinc-700 text-center">—</p>
        )}
      </div>

      {/* Weight input */}
      {!isTime && (
        <div className="flex-1">
          <input
            type="number"
            inputMode="decimal"
            placeholder={lastWeight ?? 'kg'}
            value={localSet.weight}
            disabled={done}
            onChange={(e) => onChange('weight', e.target.value)}
            className="w-full h-10 bg-zinc-800 rounded-lg px-3 text-center text-white text-sm font-mono disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          />
        </div>
      )}

      {/* Reps input */}
      <div className="flex-1">
        <input
          type="number"
          inputMode="numeric"
          placeholder={isTime ? lastReps ?? 's' : lastReps ?? 'reps'}
          value={localSet.reps}
          disabled={done}
          onChange={(e) => onChange('reps', e.target.value)}
          className="w-full h-10 bg-zinc-800 rounded-lg px-3 text-center text-white text-sm font-mono disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
        />
      </div>

      {/* Complete button */}
      <button
        disabled={done}
        onClick={onComplete}
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-95 ${
          done
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'bg-zinc-700 text-zinc-400 active:bg-emerald-600 active:text-white'
        }`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </button>
    </div>
  )
}

// ─── Main Workout Page ────────────────────────────────────────────────────────

export default function WorkoutPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [session, setSession] = useState<Session | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [localSets, setLocalSets] = useState<Record<string, LocalSet[]>>({})
  const [lastSessionSets, setLastSessionSets] = useState<SetRecord[]>([])
  const [restTimer, setRestTimer] = useState<RestTimerState | null>(null)
  const [loading, setLoading] = useState(true)
  const [restSeconds, setRestSeconds] = useState(DEFAULT_REST_SECONDS)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Fetch session + sets + last session
  useEffect(() => {
    async function load() {
      const [sessRes, setsRes] = await Promise.all([
        supabase.from('sessions').select('*').eq('id', id).single(),
        supabase.from('sets').select('*').eq('session_id', id).order('created_at'),
      ])

      if (sessRes.error || !sessRes.data) {
        router.push('/')
        return
      }

      const sess: Session = sessRes.data
      setSession(sess)

      const workout = WORKOUTS[sess.day_type as DayType]

      // Build local sets from DB
      const dbSets: SetRecord[] = setsRes.data ?? []
      const initialLocal: Record<string, LocalSet[]> = {}

      workout.exercises.forEach((ex) => {
        const exSets = dbSets.filter((s) => s.exercise === ex.name)
        initialLocal[ex.name] = Array.from({ length: ex.sets }, (_, i) => {
          const dbSet = exSets.find((s) => s.set_number === i + 1)
          return {
            setNumber: i + 1,
            weight: dbSet?.weight_kg?.toString() ?? '',
            reps: dbSet?.reps?.toString() ?? '',
            completed: dbSet?.completed ?? false,
            dbId: dbSet?.id,
          }
        })
      })

      setLocalSets(initialLocal)

      // Find last session of same type (not today's)
      const { data: prevSessions } = await supabase
        .from('sessions')
        .select('id')
        .eq('day_type', sess.day_type)
        .neq('id', id)
        .order('date', { ascending: false })
        .limit(1)

      if (prevSessions && prevSessions.length > 0) {
        const { data: prevSets } = await supabase
          .from('sets')
          .select('*')
          .eq('session_id', prevSessions[0].id)

        setLastSessionSets(prevSets ?? [])
      }

      setLoading(false)
    }

    load()
  }, [id, router])

  // Rest timer tick
  useEffect(() => {
    if (!restTimer?.active) return

    timerRef.current = setInterval(() => {
      setRestTimer((prev) => {
        if (!prev) return null
        if (prev.seconds <= 1) {
          clearInterval(timerRef.current!)
          playTimerEndSound()
          return { ...prev, active: false, seconds: 0 }
        }
        return { ...prev, seconds: prev.seconds - 1 }
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [restTimer?.active])

  const skipTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setRestTimer(null)
  }, [])

  const add30 = useCallback(() => {
    setRestTimer((prev) => prev ? { ...prev, seconds: prev.seconds + 30, initialSeconds: prev.initialSeconds + 30 } : null)
  }, [])

  async function completeSet(exerciseName: string, setNumber: number) {
    if (!session) return

    const sets = localSets[exerciseName]
    if (!sets) return
    const s = sets[setNumber - 1]
    if (s.completed) return

    // Optimistic update
    setLocalSets((prev) => ({
      ...prev,
      [exerciseName]: prev[exerciseName].map((ls) =>
        ls.setNumber === setNumber ? { ...ls, completed: true } : ls
      ),
    }))

    // Write to Supabase
    const payload = {
      session_id: session.id,
      exercise: exerciseName,
      set_number: setNumber,
      weight_kg: s.weight ? parseFloat(s.weight) : null,
      reps: s.reps ? parseInt(s.reps) : null,
      completed: true,
    }

    if (s.dbId) {
      await supabase.from('sets').update(payload).eq('id', s.dbId)
    } else {
      const { data } = await supabase.from('sets').insert(payload).select().single()
      if (data) {
        setLocalSets((prev) => ({
          ...prev,
          [exerciseName]: prev[exerciseName].map((ls) =>
            ls.setNumber === setNumber ? { ...ls, dbId: data.id } : ls
          ),
        }))
      }
    }

    // Start rest timer
    setRestTimer({
      active: true,
      seconds: restSeconds,
      initialSeconds: restSeconds,
      exerciseName,
      setNumber,
    })
  }

  function updateSet(exerciseName: string, setNumber: number, field: 'weight' | 'reps', value: string) {
    setLocalSets((prev) => ({
      ...prev,
      [exerciseName]: prev[exerciseName].map((ls) =>
        ls.setNumber === setNumber ? { ...ls, [field]: value } : ls
      ),
    }))
  }

  async function unvalidateAllSets(exerciseName: string) {
    if (!session) return
    const sets = localSets[exerciseName]
    if (!sets) return
    const done = sets.filter((s) => s.completed)
    if (done.length === 0) return

    // Optimistic update
    setLocalSets((prev) => ({
      ...prev,
      [exerciseName]: prev[exerciseName].map((ls) => ({ ...ls, completed: false })),
    }))

    await Promise.all(
      done.map((s) =>
        s.dbId
          ? supabase.from('sets').update({ completed: false }).eq('id', s.dbId)
          : Promise.resolve()
      )
    )
  }

  async function completeAllSets(exerciseName: string) {
    if (!session) return
    const sets = localSets[exerciseName]
    if (!sets) return
    const pending = sets.filter((s) => !s.completed)
    if (pending.length === 0) return

    // Optimistic update
    setLocalSets((prev) => ({
      ...prev,
      [exerciseName]: prev[exerciseName].map((ls) => ({ ...ls, completed: true })),
    }))

    // Write all pending sets to Supabase in parallel
    await Promise.all(
      pending.map(async (s) => {
        const payload = {
          session_id: session.id,
          exercise: exerciseName,
          set_number: s.setNumber,
          weight_kg: s.weight ? parseFloat(s.weight) : null,
          reps: s.reps ? parseInt(s.reps) : null,
          completed: true,
        }
        if (s.dbId) {
          await supabase.from('sets').update(payload).eq('id', s.dbId)
        } else {
          const { data } = await supabase.from('sets').insert(payload).select().single()
          if (data) {
            setLocalSets((prev) => ({
              ...prev,
              [exerciseName]: prev[exerciseName].map((ls) =>
                ls.setNumber === s.setNumber ? { ...ls, dbId: data.id } : ls
              ),
            }))
          }
        }
      })
    )
  }

  function getLastSet(exerciseName: string, setNumber: number): { weight: string | null; reps: string | null } {
    const s = lastSessionSets.find((r) => r.exercise === exerciseName && r.set_number === setNumber)
    return {
      weight: s?.weight_kg?.toString() ?? null,
      reps: s?.reps?.toString() ?? null,
    }
  }

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Cargando entrenamiento...</p>
        </div>
      </div>
    )
  }

  const dayType = session.day_type as DayType
  const workout = WORKOUTS[dayType]
  const exercises = workout.exercises
  const exercise = exercises[currentIndex]
  const colorClass = DAY_TYPE_COLORS[dayType]
  const sets = localSets[exercise.name] ?? []
  const completedSets = sets.filter((s) => s.completed).length
  const totalCompleted = exercises.reduce((acc, ex) => {
    const s = localSets[ex.name] ?? []
    return acc + s.filter((ls) => ls.completed).length
  }, 0)
  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets, 0)

  return (
    <>
      {restTimer && restTimer.seconds > 0 && (
        <RestTimerOverlay timer={restTimer} onSkip={skipTimer} onAdd30={add30} />
      )}

      <main className="min-h-screen bg-zinc-950 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-12 pb-4">
          <Link href="/" className="p-2 -ml-2 text-zinc-400 active:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          <div className="text-center">
            <h1 className={`text-lg font-bold ${colorClass}`}>{workout.name}</h1>
            <p className="text-zinc-500 text-xs">{session.date}</p>
          </div>

          {/* Rest timer config */}
          <button
            onClick={() => {
              const val = prompt(`Descanso en segundos (actual: ${restSeconds}s)`, restSeconds.toString())
              if (val && !isNaN(parseInt(val))) setRestSeconds(parseInt(val))
            }}
            className="p-2 -mr-2 text-zinc-400 active:text-white"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* Overall progress bar */}
        <div className="px-4 mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-zinc-600 text-xs">{totalCompleted} / {totalSets} series totales</span>
            <span className="text-zinc-600 text-xs">{Math.round((totalCompleted / totalSets) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${(totalCompleted / totalSets) * 100}%` }}
            />
          </div>
        </div>

        {/* Exercise tabs */}
        <div className="flex gap-1.5 px-4 pb-4 overflow-x-auto scrollbar-none mt-3">
          {exercises.map((ex, i) => {
            const exSets = localSets[ex.name] ?? []
            const done = exSets.filter((s) => s.completed).length
            const isActive = i === currentIndex
            const isDone = done === ex.sets
            return (
              <button
                key={ex.name}
                onClick={() => setCurrentIndex(i)}
                className={`shrink-0 h-8 px-3 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-orange-500 text-white'
                    : isDone
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {i + 1}
                {isDone && ' ✓'}
              </button>
            )
          })}
        </div>

        {/* Exercise content */}
        <div className="flex-1 px-4 overflow-y-auto">
          {/* Exercise header */}
          <div className="mb-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white leading-tight">{exercise.name}</h2>
                <p className="text-zinc-400 text-sm mt-1">
                  {exercise.sets} series × {exercise.repsRange}{exercise.isTime ? '' : ' reps'}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {completedSets < sets.length && (
                  <button
                    onClick={() => completeAllSets(exercise.name)}
                    className="h-7 px-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold active:bg-emerald-500/30"
                  >
                    Validar todo
                  </button>
                )}
                {completedSets > 0 && (
                  <button
                    onClick={() => unvalidateAllSets(exercise.name)}
                    className="h-7 px-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-500 text-xs font-semibold active:bg-zinc-700"
                  >
                    Resetear
                  </button>
                )}
                <span className="text-xs text-zinc-600 font-medium">
                  {currentIndex + 1}/{exercises.length}
                </span>
              </div>
            </div>

            {/* Progress for this exercise */}
            <div className="flex gap-1.5 mt-3">
              {sets.map((s) => (
                <div
                  key={s.setNumber}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    s.completed ? 'bg-emerald-500' : 'bg-zinc-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Column headers */}
          <div className="flex items-center gap-3 px-3 mb-2">
            <span className="w-6" />
            <span className="w-16 text-center text-xs text-zinc-600 font-medium">Anterior</span>
            {!exercise.isTime && <span className="flex-1 text-center text-xs text-zinc-600 font-medium">Peso (kg)</span>}
            <span className="flex-1 text-center text-xs text-zinc-600 font-medium">{exercise.isTime ? 'Seg.' : 'Reps'}</span>
            <span className="w-10" />
          </div>

          {/* Set rows */}
          <div className="space-y-2 mb-6">
            {sets.map((s) => {
              const last = getLastSet(exercise.name, s.setNumber)
              return (
                <SetRow
                  key={s.setNumber}
                  setNumber={s.setNumber}
                  localSet={s}
                  lastWeight={last.weight}
                  lastReps={last.reps}
                  isTime={exercise.isTime}
                  onChange={(field, value) => updateSet(exercise.name, s.setNumber, field, value)}
                  onComplete={() => completeSet(exercise.name, s.setNumber)}
                />
              )
            })}
          </div>
        </div>

        {/* Bottom navigation */}
        <div className="px-4 pb-8 pt-3 border-t border-zinc-900 flex gap-3">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="flex-1 h-12 rounded-xl bg-zinc-800 text-zinc-300 font-semibold disabled:opacity-30 active:bg-zinc-700"
          >
            ← Anterior
          </button>

          {currentIndex < exercises.length - 1 ? (
            <button
              onClick={() => setCurrentIndex((i) => i + 1)}
              className="flex-1 h-12 rounded-xl bg-zinc-800 text-zinc-300 font-semibold active:bg-zinc-700"
            >
              Siguiente →
            </button>
          ) : (
            <button
              onClick={() => router.push('/')}
              className="flex-1 h-12 rounded-xl bg-orange-500 text-white font-bold active:bg-orange-600"
            >
              Terminar ✓
            </button>
          )}
        </div>
      </main>
    </>
  )
}
