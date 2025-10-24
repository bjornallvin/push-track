import { getRedis } from '@/lib/redis'
import type { Challenge, DailyLog, ProgressMetrics, ActivityMetrics, ActivityUnit } from './types'
import { calculateMetrics, calculateActivityMetrics } from './calculator'
import { getTodayLocalDate, getUserTimezone } from '@/lib/utils'

/**
 * ChallengeRepository: Data access layer for Redis operations
 */

export class ChallengeRepository {
  /**
   * Create a new challenge
   * Returns the challenge ID (UUID)
   */
  async createChallenge(
    duration: number,
    timezone: string,
    activities: string[],
    activityUnits: Record<string, ActivityUnit>,
    email?: string
  ): Promise<string> {
    const redis = await getRedis()
    const challengeId = crypto.randomUUID()

    const challenge: Challenge = {
      id: challengeId,
      duration,
      startDate: getTodayLocalDate(),
      status: 'active',
      createdAt: Date.now(),
      timezone,
      activities,
      activityUnits,
      ...(email && { email }),
    }

    // Calculate TTL: duration + 30 day grace period
    const gracePeriodDays = 30
    const ttlSeconds = (duration + gracePeriodDays) * 24 * 60 * 60

    // Store challenge in Redis hash (activities and activityUnits as JSON strings)
    await redis.hSet(`challenge:${challengeId}`, {
      ...challenge,
      activities: JSON.stringify(activities),
      activityUnits: JSON.stringify(activityUnits),
    } as any)
    await redis.expire(`challenge:${challengeId}`, ttlSeconds)

    // Initialize empty logs sorted set
    await redis.expire(`challenge:${challengeId}:logs`, ttlSeconds)

    return challengeId
  }

  /**
   * Get a challenge by ID
   * Returns null if not found
   * Automatically migrates old challenges to multi-activity format
   */
  async getChallenge(challengeId: string): Promise<Challenge | null> {
    const redis = await getRedis()
    const data = await redis.hGetAll(`challenge:${challengeId}`)

    if (!data || Object.keys(data).length === 0) {
      return null
    }

    // Migration: Add activities field if missing (old single-activity challenges)
    let activities: string[]
    if (data.activities) {
      activities = JSON.parse(data.activities)
    } else {
      // Old challenge - default to single "Push-ups" activity
      activities = ['Push-ups']
      // Persist the migration
      await redis.hSet(`challenge:${challengeId}`, {
        activities: JSON.stringify(activities),
      })
    }

    // Migration: Add activityUnits field if missing (default to "reps" for all activities)
    let activityUnits: Record<string, ActivityUnit>
    if (data.activityUnits) {
      activityUnits = JSON.parse(data.activityUnits)
    } else {
      // Old challenge - default all activities to "reps"
      activityUnits = {}
      for (const activity of activities) {
        activityUnits[activity] = 'reps'
      }
      // Persist the migration
      await redis.hSet(`challenge:${challengeId}`, {
        activityUnits: JSON.stringify(activityUnits),
      })
    }

    // Convert Redis string fields back to proper types
    return {
      id: data.id,
      duration: parseInt(data.duration),
      startDate: data.startDate,
      status: data.status as 'active' | 'completed' | 'abandoned',
      createdAt: parseInt(data.createdAt),
      completedAt: data.completedAt ? parseInt(data.completedAt) : undefined,
      timezone: data.timezone,
      email: data.email,
      activities,
      activityUnits,
    }
  }

  /**
   * Update challenge status
   */
  async updateChallengeStatus(
    challengeId: string,
    status: 'active' | 'completed' | 'abandoned',
    completedAt?: number
  ): Promise<void> {
    const redis = await getRedis()
    await redis.hSet(`challenge:${challengeId}`, {
      status,
      ...(completedAt && { completedAt: completedAt.toString() }),
    })
  }

  /**
   * Abandon (delete) a challenge
   */
  async abandonChallenge(challengeId: string): Promise<void> {
    const redis = await getRedis()
    const challenge = await this.getChallenge(challengeId)

    // Delete all related keys
    await redis.del(`challenge:${challengeId}`)
    await redis.del(`challenge:${challengeId}:logs`)
    await redis.del(`challenge:${challengeId}:metrics`) // old single metrics key (backward compat)

    // Delete per-activity metrics if challenge exists
    if (challenge) {
      for (const activity of challenge.activities) {
        await redis.del(`challenge:${challengeId}:metrics:${activity}`)
      }
    }
  }

  /**
   * Log reps for a specific activity
   * - targetDate: Optional date (YYYY-MM-DD) for editing past entries. Defaults to today.
   * - editMode: If true, allows overwriting existing logs without throwing error
   * Throws error if already logged this activity for the date (unless in edit mode)
   */
  async logReps(
    challengeId: string,
    activity: string,
    reps: number,
    targetDate?: string,
    editMode = false
  ): Promise<DailyLog> {
    const redis = await getRedis()
    const date = targetDate || getTodayLocalDate()

    // Check if already logged this activity for this date (skip in edit mode)
    if (!editMode) {
      const logs = await this.getAllLogs(challengeId)
      const hasLogged = logs.some((log) => log.date === date && log.activity === activity)
      if (hasLogged) {
        throw new Error(`Already logged ${activity} for ${date}`)
      }
    } else {
      // In edit mode, remove existing log for this date+activity if it exists
      const logs = await this.getAllLogs(challengeId)
      const existingLog = logs.find((log) => log.date === date && log.activity === activity)
      if (existingLog) {
        // Remove the old log entry
        await redis.zRem(`challenge:${challengeId}:logs`, JSON.stringify(existingLog))
      }
    }

    const log: DailyLog = {
      date,
      activity,
      reps,
      timestamp: Date.now(),
      timezone: getUserTimezone(),
    }

    // Convert date to Unix timestamp for sorting
    const dateTimestamp = new Date(date).getTime()

    // Add to sorted set
    await redis.zAdd(`challenge:${challengeId}:logs`, {
      score: dateTimestamp,
      value: JSON.stringify(log),
    })

    // Refresh TTL
    const challenge = await this.getChallenge(challengeId)
    if (challenge) {
      const ttlSeconds = (challenge.duration + 30) * 24 * 60 * 60
      await redis.expire(`challenge:${challengeId}:logs`, ttlSeconds)
    }

    return log
  }

  /**
   * Log pushups for today (deprecated - use logReps instead)
   * @deprecated Use logReps instead
   */
  async logPushups(
    challengeId: string,
    pushups: number
  ): Promise<DailyLog> {
    return this.logReps(challengeId, 'Push-ups', pushups)
  }

  /**
   * Check if a specific activity has been logged today
   */
  async hasLoggedToday(challengeId: string, activity: string): Promise<boolean> {
    const logs = await this.getAllLogs(challengeId)
    const today = getTodayLocalDate()
    return logs.some((log) => log.date === today && log.activity === activity)
  }

  /**
   * Check if all activities have been logged today
   */
  async hasLoggedAllActivitiesToday(challengeId: string): Promise<boolean> {
    const challenge = await this.getChallenge(challengeId)
    if (!challenge) return false

    const logs = await this.getAllLogs(challengeId)
    const today = getTodayLocalDate()
    const todayLogs = logs.filter((log) => log.date === today)

    // Check if we have a log for each activity
    return challenge.activities.every((activity) =>
      todayLogs.some((log) => log.activity === activity)
    )
  }

  /**
   * Get all logs for a challenge (sorted by date ascending)
   * Automatically migrates old logs to multi-activity format
   */
  async getAllLogs(challengeId: string): Promise<DailyLog[]> {
    const redis = await getRedis()
    const results = await redis.zRange(`challenge:${challengeId}:logs`, 0, -1)

    if (!results || results.length === 0) {
      return []
    }

    return results.map((item) => {
      const log = JSON.parse(item as string) as DailyLog

      // Migration: Add activity field if missing (old logs)
      if (!log.activity) {
        log.activity = 'Push-ups'
      }

      // Migration: Copy pushups to reps if reps is missing
      if (log.pushups !== undefined && log.reps === undefined) {
        log.reps = log.pushups
      }

      return log
    })
  }

  /**
   * Get logs for a specific activity
   */
  async getLogsForActivity(challengeId: string, activity: string): Promise<DailyLog[]> {
    const allLogs = await this.getAllLogs(challengeId)
    return allLogs.filter((log) => log.activity === activity)
  }

  /**
   * Get yesterday's log for a specific activity (for pre-filling stepper)
   * Returns null if no log exists
   */
  async getYesterdayLog(challengeId: string, activity: string): Promise<DailyLog | null> {
    const logs = await this.getLogsForActivity(challengeId, activity)
    if (logs.length === 0) return null

    // Sort descending and get the most recent
    const sortedLogs = logs.sort((a, b) => b.date.localeCompare(a.date))

    // Check if the most recent log is yesterday
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const mostRecent = sortedLogs[0]
    return mostRecent.date === yesterdayStr ? mostRecent : null
  }

  /**
   * Get metrics for a specific activity
   * Calculates metrics on-demand from stored data
   */
  async getMetricsForActivity(challengeId: string, activity: string): Promise<ActivityMetrics> {
    const challenge = await this.getChallenge(challengeId)
    if (!challenge) {
      throw new Error('Challenge not found')
    }

    const logs = await this.getAllLogs(challengeId)
    return calculateActivityMetrics(challenge, logs, activity)
  }

  /**
   * Get metrics for all activities in a challenge
   */
  async getAllActivityMetrics(challengeId: string): Promise<Map<string, ActivityMetrics>> {
    const challenge = await this.getChallenge(challengeId)
    if (!challenge) {
      throw new Error('Challenge not found')
    }

    const metricsMap = new Map<string, ActivityMetrics>()

    for (const activity of challenge.activities) {
      const metrics = await this.getMetricsForActivity(challengeId, activity)
      metricsMap.set(activity, metrics)
    }

    return metricsMap
  }

  /**
   * Get metrics for a challenge (backward compatible)
   * Calculates metrics on-demand from stored data
   * @deprecated Use getMetricsForActivity or getAllActivityMetrics instead
   */
  async getMetrics(challengeId: string): Promise<ProgressMetrics> {
    const challenge = await this.getChallenge(challengeId)
    if (!challenge) {
      throw new Error('Challenge not found')
    }

    const logs = await this.getAllLogs(challengeId)
    return calculateMetrics(challenge, logs)
  }

  /**
   * Check if challenge is complete (currentDay >= duration)
   * If complete, update status
   */
  async checkAndUpdateCompletion(challengeId: string): Promise<boolean> {
    const challenge = await this.getChallenge(challengeId)
    if (!challenge || challenge.status !== 'active') {
      return false
    }

    const metrics = await this.getMetrics(challengeId)

    if (metrics.currentDay >= challenge.duration) {
      await this.updateChallengeStatus(
        challengeId,
        'completed',
        Date.now()
      )
      return true
    }

    return false
  }
}

// Export singleton instance
export const challengeRepository = new ChallengeRepository()
