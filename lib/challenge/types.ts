/**
 * Core TypeScript interfaces for the Pushup Challenge Tracker
 */

export interface Challenge {
  id: string // Challenge UUID (also used in URL)
  duration: number // Challenge length in days (1-365)
  startDate: string // YYYY-MM-DD in user's local timezone
  status: 'active' | 'completed' | 'abandoned'
  createdAt: number // Unix timestamp (ms)
  completedAt?: number // Unix timestamp (ms), undefined if not completed
  timezone: string // IANA timezone at creation
}

export interface DailyLog {
  date: string // YYYY-MM-DD in user's local timezone
  pushups: number // Pushup count (0-10,000)
  timestamp: number // Unix timestamp (ms) when logged
  timezone: string // User's timezone at time of logging
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

// API Request types
export interface CreateChallengeRequest {
  duration: number // 1-365 days
}

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
}

export interface GetChallengeResponse {
  id: string
  duration: number
  startDate: string
  status: 'active' | 'completed'
  currentDay: number
  metrics: {
    streak: number
    personalBest: number
    totalPushups: number
    daysLogged: number
    completionRate: number
  }
  hasLoggedToday: boolean
  yesterdayCount: number | null
}

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
