import type { DayType, WorkoutDay } from './types'

export const WORKOUTS: Record<DayType, WorkoutDay> = {
  push: {
    name: 'Empuje',
    subtitle: 'Pecho · Hombros · Tríceps',
    day: 'Lunes',
    dayIndex: 1,
    exercises: [
      { name: 'Press de Banca con Barra', sets: 4, repsRange: '6-8' },
      { name: 'Press Inclinado con Mancuerna', sets: 3, repsRange: '8-10' },
      { name: 'Press de Hombros con Mancuerna', sets: 3, repsRange: '8-10' },
      { name: 'Elevaciones Laterales', sets: 3, repsRange: '12-15' },
      { name: 'Jalón de Tríceps en Cable', sets: 3, repsRange: '10-12' },
      { name: 'Plancha', sets: 3, repsRange: '30-45s', isTime: true },
    ],
  },
  pull: {
    name: 'Jale',
    subtitle: 'Espalda · Bíceps',
    day: 'Martes',
    dayIndex: 2,
    exercises: [
      { name: 'Jalón al Pecho', sets: 4, repsRange: '6-8' },
      { name: 'Remo con Mancuerna a Un Brazo', sets: 3, repsRange: '8-10' },
      { name: 'Remo en Cable Sentado', sets: 3, repsRange: '10-12' },
      { name: 'Face Pulls', sets: 3, repsRange: '12-15' },
      { name: 'Curl de Bíceps con Barra', sets: 3, repsRange: '10-12' },
      { name: 'Rueda Abdominal', sets: 3, repsRange: '8-10' },
    ],
  },
  legs: {
    name: 'Piernas',
    subtitle: 'Cuádriceps · Isquios · Glúteos · Pantorrillas',
    day: 'Jueves',
    dayIndex: 4,
    exercises: [
      { name: 'Sentadilla con Barra', sets: 4, repsRange: '6-8' },
      { name: 'Prensa de Piernas', sets: 3, repsRange: '10-12' },
      { name: 'Extensión de Piernas', sets: 3, repsRange: '12-15' },
      { name: 'Curl de Piernas Acostado', sets: 3, repsRange: '10-12' },
      { name: 'Peso Muerto Rumano', sets: 3, repsRange: '8-10' },
      { name: 'Elevaciones de Pantorrillas', sets: 4, repsRange: '15-20' },
    ],
  },
}

export function getTodayDayType(): DayType | null {
  const day = new Date().getDay()
  if (day === 1) return 'push'
  if (day === 2) return 'pull'
  if (day === 4) return 'legs'
  return null
}

export function getDayLabel(dayType: DayType): string {
  return WORKOUTS[dayType].name
}

export const DAY_TYPE_LABELS: Record<DayType, string> = {
  push: 'Empuje',
  pull: 'Jale',
  legs: 'Piernas',
}

export const DAY_TYPE_COLORS: Record<DayType, string> = {
  push: 'text-blue-400',
  pull: 'text-emerald-400',
  legs: 'text-violet-400',
}

export const DAY_TYPE_BG: Record<DayType, string> = {
  push: 'bg-blue-500/20 border-blue-500/40',
  pull: 'bg-emerald-500/20 border-emerald-500/40',
  legs: 'bg-violet-500/20 border-violet-500/40',
}
