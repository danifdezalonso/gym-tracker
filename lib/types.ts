export type DayType = 'push' | 'pull' | 'legs'

export interface Session {
  id: string
  date: string
  day_type: DayType
  created_at: string
}

export interface SetRecord {
  id: string
  session_id: string
  exercise: string
  set_number: number
  weight_kg: number | null
  reps: number | null
  completed: boolean
  created_at: string
}

export interface Exercise {
  name: string
  sets: number
  repsRange: string
  isTime?: boolean
}

export interface WorkoutDay {
  name: string
  subtitle: string
  day: string
  dayIndex: number
  exercises: Exercise[]
}
