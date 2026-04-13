import type { DayType, WorkoutDay } from './types'

export const WORKOUTS: Record<DayType, WorkoutDay> = {
  pull: {
    name: 'Jale',
    subtitle: 'Espalda · Bíceps',
    day: 'Lunes',
    dayIndex: 1,
    exercises: [
      { name: 'Press de Banca con Barra', sets: 4, repsRange: '6-8' },
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
    day: 'Martes',
    dayIndex: 2,
    exercises: [
      { name: 'Sentadilla con Barra', sets: 4, repsRange: '6-8' },
      { name: 'Prensa de Piernas', sets: 3, repsRange: '10-12' },
      { name: 'Extensión de Piernas', sets: 3, repsRange: '12-15' },
      { name: 'Curl de Piernas Acostado', sets: 3, repsRange: '10-12' },
      { name: 'Peso Muerto Rumano', sets: 3, repsRange: '8-10' },
      { name: 'Elevaciones de Pantorrillas', sets: 4, repsRange: '15-20' },
    ],
  },
  push: {
    name: 'Empuje',
    subtitle: 'Pecho · Hombros · Tríceps',
    day: 'Jueves',
    dayIndex: 4,
    exercises: [
      { name: 'Press de Banca con Barra', sets: 4, repsRange: '6-8' },
      { name: 'Press Inclinado con Mancuerna', sets: 3, repsRange: '8-10' },
      { name: 'Press de Hombros con Mancuerna', sets: 3, repsRange: '8-10' },
      { name: 'Elevaciones Laterales', sets: 3, repsRange: '12-15' },
      { name: 'Jalón de Tríceps en Cable (Polea Alta)', sets: 3, repsRange: '10-12' },
      { name: 'Extensión de Tríceps sobre la Cabeza en Cable', sets: 3, repsRange: '10-12' },
      { name: 'Plancha', sets: 3, repsRange: '30-45s', isTime: true },
    ],
  },
  upper: {
    name: 'Tren Superior',
    subtitle: 'Pecho · Espalda · Hombros · Brazos',
    day: 'Opcional',
    dayIndex: -1,
    optional: true,
    exercises: [
      { name: 'Press de Banca con Barra', sets: 4, repsRange: '6-8' },
      { name: 'Jalón al Pecho', sets: 4, repsRange: '6-8' },
      { name: 'Press de Hombros con Mancuerna', sets: 3, repsRange: '8-10' },
      { name: 'Remo con Mancuerna a Un Brazo', sets: 3, repsRange: '8-10' },
      { name: 'Elevaciones Laterales', sets: 3, repsRange: '12-15' },
      { name: 'Curl de Bíceps con Barra', sets: 3, repsRange: '10-12' },
      { name: 'Jalón de Tríceps en Cable (Polea Alta)', sets: 3, repsRange: '10-12' },
    ],
  },
}

export function getTodayDayType(): DayType | null {
  const day = new Date().getDay()
  if (day === 1) return 'pull'
  if (day === 2) return 'legs'
  if (day === 4) return 'push'
  return null
}

export function getDayLabel(dayType: DayType): string {
  return WORKOUTS[dayType].name
}

export const DAY_TYPE_LABELS: Record<DayType, string> = {
  pull: 'Jale',
  legs: 'Piernas',
  push: 'Empuje',
  upper: 'Tren Superior',
}

export const DAY_TYPE_COLORS: Record<DayType, string> = {
  pull: 'text-emerald-400',
  legs: 'text-violet-400',
  push: 'text-blue-400',
  upper: 'text-orange-400',
}

export const DAY_TYPE_BG: Record<DayType, string> = {
  pull: 'bg-emerald-500/20 border-emerald-500/40',
  legs: 'bg-violet-500/20 border-violet-500/40',
  push: 'bg-blue-500/20 border-blue-500/40',
  upper: 'bg-orange-500/20 border-orange-500/40',
}

export const DAY_TYPE_LETTER: Record<DayType, string> = {
  pull: 'J',
  legs: 'P',
  push: 'E',
  upper: 'TS',
}
