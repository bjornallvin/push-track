import type { Challenge, DailyLog, ProgressMetrics } from './types'
import {
  getTodayLocalDate,
  daysBetween,
  formatLocalDate,
} from '@/lib/utils'

/**
 * Metrics calculation functions for the Pushup Challenge Tracker
 */

/**
 * Calculate the current day number in the challenge (1-indexed)
 * Returns 1 on the start date, 2 the next day, etc.
 * Capped at the challenge duration
 */
export function calculateCurrentDay(challenge: Challenge): number {
  const today = getTodayLocalDate()
  const daysSinceStart = daysBetween(challenge.startDate, today)
  const currentDay = daysSinceStart + 1

  // Cap at duration (don't go past final day)
  return Math.min(Math.max(currentDay, 1), challenge.duration)
}

/**
 * Calculate the current streak (consecutive days with non-zero pushups)
 * Streak counts backwards from today or the most recent non-zero day
 * Zero pushup days break the streak
 */
export function calculateStreak(logs: DailyLog[]): number {
  if (logs.length === 0) return 0

  // Sort by date descending (most recent first)
  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date))

  let streak = 0
  const today = getTodayLocalDate()
  let expectedDate = today

  for (const log of sortedLogs) {
    // If we hit a gap or zero pushups, break the streak
    if (log.date !== expectedDate || log.pushups === 0) {
      break
    }

    streak++

    // Move to previous day
    const date = new Date(expectedDate)
    date.setDate(date.getDate() - 1)
    expectedDate = formatLocalDate(date)
  }

  return streak
}

/**
 * Calculate completion rate as a percentage
 * (days logged / current day) * 100
 */
export function calculateCompletionRate(
  daysLogged: number,
  currentDay: number
): number {
  if (currentDay === 0) return 0
  return Math.round((daysLogged / currentDay) * 100)
}

/**
 * Find the personal best (highest single-day pushup count)
 */
export function calculatePersonalBest(logs: DailyLog[]): number {
  if (logs.length === 0) return 0
  return Math.max(...logs.map((log) => log.pushups))
}

/**
 * Calculate total pushups across all logged days
 */
export function calculateTotalPushups(logs: DailyLog[]): number {
  return logs.reduce((sum, log) => sum + log.pushups, 0)
}

/**
 * Count days with any log entry (including zero pushups)
 */
export function calculateDaysLogged(logs: DailyLog[]): number {
  return logs.length
}

/**
 * Calculate days missed (current day - days logged)
 */
export function calculateDaysMissed(
  currentDay: number,
  daysLogged: number
): number {
  return Math.max(0, currentDay - daysLogged)
}

/**
 * Calculate all progress metrics from challenge and logs
 * This is the main function used by the repository
 */
export function calculateMetrics(
  challenge: Challenge,
  logs: DailyLog[]
): ProgressMetrics {
  const currentDay = calculateCurrentDay(challenge)
  const daysLogged = calculateDaysLogged(logs)
  const daysMissed = calculateDaysMissed(currentDay, daysLogged)

  return {
    currentDay,
    streak: calculateStreak(logs),
    personalBest: calculatePersonalBest(logs),
    totalPushups: calculateTotalPushups(logs),
    daysLogged,
    daysMissed,
    completionRate: calculateCompletionRate(daysLogged, currentDay),
    calculatedAt: Date.now(),
  }
}
