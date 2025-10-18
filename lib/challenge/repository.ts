import { getRedis } from '@/lib/redis'
import type { Challenge, DailyLog, ProgressMetrics } from './types'
import { calculateMetrics } from './calculator'
import { getTodayLocalDate, getUserTimezone } from '@/lib/utils'

/**
 * ChallengeRepository: Data access layer for Redis operations
 */

export class ChallengeRepository {
  /**
   * Create a new challenge
   * Returns the challenge ID (UUID)
   */
  async createChallenge(duration: number, timezone: string, email?: string): Promise<string> {
    const redis = await getRedis()
    const challengeId = crypto.randomUUID()

    const challenge: Challenge = {
      id: challengeId,
      duration,
      startDate: getTodayLocalDate(),
      status: 'active',
      createdAt: Date.now(),
      timezone,
      ...(email && { email }),
    }

    // Calculate TTL: duration + 30 day grace period
    const gracePeriodDays = 30
    const ttlSeconds = (duration + gracePeriodDays) * 24 * 60 * 60

    // Store challenge in Redis hash
    await redis.hSet(`challenge:${challengeId}`, challenge as any)
    await redis.expire(`challenge:${challengeId}`, ttlSeconds)

    // Initialize empty logs sorted set
    await redis.expire(`challenge:${challengeId}:logs`, ttlSeconds)

    // Initialize metrics
    await redis.expire(`challenge:${challengeId}:metrics`, ttlSeconds)

    return challengeId
  }

  /**
   * Get a challenge by ID
   * Returns null if not found
   */
  async getChallenge(challengeId: string): Promise<Challenge | null> {
    const redis = await getRedis()
    const data = await redis.hGetAll(`challenge:${challengeId}`)

    if (!data || Object.keys(data).length === 0) {
      return null
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

    // Delete all related keys
    await redis.del(`challenge:${challengeId}`)
    await redis.del(`challenge:${challengeId}:logs`)
    await redis.del(`challenge:${challengeId}:metrics`)
  }

  /**
   * Log pushups for today
   * Throws error if already logged today
   */
  async logPushups(
    challengeId: string,
    pushups: number
  ): Promise<DailyLog> {
    const redis = await getRedis()
    const today = getTodayLocalDate()

    // Check if already logged today
    const hasLogged = await this.hasLoggedToday(challengeId)
    if (hasLogged) {
      throw new Error('Already logged pushups for today')
    }

    const log: DailyLog = {
      date: today,
      pushups,
      timestamp: Date.now(),
      timezone: getUserTimezone(),
    }

    // Convert date to Unix timestamp for sorting
    const dateTimestamp = new Date(today).getTime()

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
   * Check if pushups have been logged today
   */
  async hasLoggedToday(challengeId: string): Promise<boolean> {
    const logs = await this.getAllLogs(challengeId)
    const today = getTodayLocalDate()
    return logs.some((log) => log.date === today)
  }

  /**
   * Get all logs for a challenge (sorted by date ascending)
   */
  async getAllLogs(challengeId: string): Promise<DailyLog[]> {
    const redis = await getRedis()
    const results = await redis.zRange(`challenge:${challengeId}:logs`, 0, -1)

    if (!results || results.length === 0) {
      return []
    }

    return results.map((item) => JSON.parse(item as string) as DailyLog)
  }

  /**
   * Get yesterday's log (for pre-filling stepper)
   * Returns null if no log exists
   */
  async getYesterdayLog(challengeId: string): Promise<DailyLog | null> {
    const logs = await this.getAllLogs(challengeId)
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
   * Get or calculate metrics for a challenge
   * Caches metrics in Redis
   */
  async getMetrics(challengeId: string): Promise<ProgressMetrics> {
    const redis = await getRedis()

    // Try to get cached metrics
    const cachedData = await redis.hGetAll(`challenge:${challengeId}:metrics`)

    if (cachedData && Object.keys(cachedData).length > 0) {
      // Return cached metrics
      return {
        currentDay: parseInt(cachedData.currentDay),
        streak: parseInt(cachedData.streak),
        personalBest: parseInt(cachedData.personalBest),
        totalPushups: parseInt(cachedData.totalPushups),
        daysLogged: parseInt(cachedData.daysLogged),
        daysMissed: parseInt(cachedData.daysMissed),
        completionRate: parseInt(cachedData.completionRate),
        calculatedAt: parseInt(cachedData.calculatedAt),
      }
    }

    // Calculate and cache metrics
    return await this.calculateAndCacheMetrics(challengeId)
  }

  /**
   * Calculate metrics and cache them in Redis
   * This is called after logging pushups or when metrics are stale
   */
  async calculateAndCacheMetrics(
    challengeId: string
  ): Promise<ProgressMetrics> {
    const redis = await getRedis()
    const challenge = await this.getChallenge(challengeId)

    if (!challenge) {
      throw new Error('Challenge not found')
    }

    const logs = await this.getAllLogs(challengeId)
    const metrics = calculateMetrics(challenge, logs)

    // Cache in Redis
    await redis.hSet(`challenge:${challengeId}:metrics`, metrics as any)

    // Set TTL to match challenge
    const ttlSeconds = (challenge.duration + 30) * 24 * 60 * 60
    await redis.expire(`challenge:${challengeId}:metrics`, ttlSeconds)

    return metrics
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
