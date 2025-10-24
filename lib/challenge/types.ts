/**
 * Core TypeScript interfaces for the Multi-Activity Challenge Tracker
 */

export type ActivityUnit = 'reps' | 'minutes' | 'seconds' | 'km' | 'miles' | 'meters' | 'hours'

export interface Challenge {
  id: string // Challenge UUID (also used in URL)
  duration: number // Challenge length in days (1-365)
  startDate: string // YYYY-MM-DD in user's local timezone
  status: 'active' | 'completed' | 'abandoned'
  createdAt: number // Unix timestamp (ms)
  completedAt?: number // Unix timestamp (ms), undefined if not completed
  timezone: string // IANA timezone at creation
  email?: string // Optional email for sending challenge link
  activities: string[] // Array of 1-5 activity names (e.g., ["Push-ups", "Pull-ups"])
  activityUnits?: Record<string, ActivityUnit> // Maps activity name to unit (defaults to "reps" if missing)
}

export interface DailyLog {
  date: string // YYYY-MM-DD in user's local timezone
  activity: string // Activity name (e.g., "Push-ups", "Pull-ups")
  reps: number // Rep count (0-10,000)
  timestamp: number // Unix timestamp (ms) when logged
  timezone: string // User's timezone at time of logging
  // Deprecated field for backward compatibility
  pushups?: number // Use 'reps' instead
}

// Derived entity for edit button logic (no storage)
export interface ChallengeDay {
  date: string // ISO date (YYYY-MM-DD)
  dayNumber: number // 1-indexed day (1 = first day)
  isPast: boolean // date < today
  isCurrent: boolean // date === today
  isFuture: boolean // date > today
  isEditable: boolean // isPast || isCurrent (no future editing)
  logs: DailyLog[] // Logs for this date (can be empty array)
}

export interface ProgressMetrics {
  currentDay: number // Day number in challenge (e.g., 5 for "Day 5 of 30")
  streak: number // Consecutive days with non-zero pushups
  personalBest: number // Highest single-day pushup count
  totalPushups: number // Sum of all logged pushups
  daysLogged: number // Count of days with any log entry
  daysMissed: number // Count of days without log entry (up to current day)
  completionRate: number // Percentage: (daysLogged / currentDay) * 100
  calculatedAt: number // Unix timestamp (ms) when metrics were calculated
}

// Per-activity metrics for multi-activity challenges
export interface ActivityMetrics {
  activity: string // Activity name
  currentDay: number // Day number in challenge (e.g., 5 for "Day 5 of 30")
  streak: number // Consecutive days with non-zero reps for this activity
  personalBest: number // Highest single-day rep count for this activity
  totalReps: number // Sum of all logged reps for this activity
  daysLogged: number // Count of days with any log entry for this activity
  daysMissed: number // Count of days without log entry for this activity
  completionRate: number // Percentage: (daysLogged / currentDay) * 100
  calculatedAt: number // Unix timestamp (ms) when metrics were calculated
}

// API Request types
export interface CreateChallengeRequest {
  duration: number // 1-365 days
  email?: string // Optional email for sending challenge link
  activities: string[] // Array of 1-5 activity names
  activityUnits: Record<string, ActivityUnit> // Maps activity name to unit
}

export interface LogRepsRequest {
  logs: Array<{
    activity: string // Activity name
    reps: number // 0-10,000 reps for this activity
  }>
  date?: string // Optional ISO date (YYYY-MM-DD) for editing past entries, defaults to today
}

// Deprecated - use LogRepsRequest instead
export interface LogPushupsRequest {
  pushups: number // 0-10,000
}

// API Response types
export interface ApiSuccessResponse<T> {
  success: true
  data: T
  timestamp: number
}

export interface ApiErrorResponse {
  error: string // Machine-readable error code
  message: string // Human-readable error message
  details?: unknown // Optional additional context
  timestamp: number
}

export interface CreateChallengeResponse {
  id: string
  duration: number
  startDate: string
  status: 'active'
  currentDay: 1
  activities: string[]
  activityUnits: Record<string, ActivityUnit>
}

export interface GetChallengeResponse {
  id: string
  duration: number
  startDate: string
  status: 'active' | 'completed' | 'abandoned'
  currentDay: number
  activities: string[]
  activityUnits: Record<string, ActivityUnit>
  activityMetrics: {
    [activity: string]: {
      streak: number
      personalBest: number
      totalReps: number
      daysLogged: number
      completionRate: number
      hasLoggedToday: boolean
      yesterdayCount: number | null
    }
  }
  // Deprecated - use activityMetrics instead
  metrics?: {
    streak: number
    personalBest: number
    totalPushups: number
    daysLogged: number
    completionRate: number
  }
  hasLoggedToday?: boolean
  yesterdayCount?: number | null
}

export interface LogRepsResponse {
  logs: Array<{
    date: string
    activity: string
    reps: number
  }>
  activityMetrics: {
    [activity: string]: {
      streak: number
      personalBest: number
      totalReps: number
      currentDay: number
    }
  }
  challengeCompleted: boolean
}

// Deprecated - use LogRepsResponse instead
export interface LogPushupsResponse {
  date: string
  pushups: number
  metrics: {
    streak: number
    personalBest: number
    currentDay: number
  }
  challengeCompleted: boolean
}

export interface CompletionSummaryResponse {
  totalPushups: number
  completionRate: number
  bestDay: {
    date: string
    pushups: number
  }
  finalStreak: number
  duration: number
  startDate: string
  completedAt: number
}
