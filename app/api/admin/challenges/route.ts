import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthHeader } from '@/lib/admin/auth'
import { getRedis } from '@/lib/redis'
import type { Challenge } from '@/lib/challenge/types'

/**
 * GET /api/admin/challenges
 * Get all challenges (requires admin token)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin token
    if (!verifyAuthHeader(request)) {
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: 'Invalid or missing admin token',
          timestamp: Date.now(),
        },
        { status: 401 }
      )
    }

    const redis = await getRedis()
    const keys = await redis.keys('challenge:*')

    const challenges: Challenge[] = []

    for (const key of keys) {
      // Skip non-hash keys (like challenge:xxx:logs or challenge:xxx:metrics:*)
      if (key.includes(':logs') || key.includes(':metrics')) continue

      const data = await redis.hGetAll(key)
      if (!data || Object.keys(data).length === 0) continue

      const challengeId = key.replace('challenge:', '')

      // Parse activities and activityUnits
      let activities: string[] = []
      if (data.activities) {
        try {
          activities = JSON.parse(data.activities)
        } catch {
          activities = ['Push-ups'] // fallback
        }
      } else {
        activities = ['Push-ups']
      }

      let activityUnits = {}
      if (data.activityUnits) {
        try {
          activityUnits = JSON.parse(data.activityUnits)
        } catch {
          activityUnits = {}
        }
      }

      challenges.push({
        id: challengeId,
        duration: parseInt(data.duration) || 0,
        startDate: data.startDate || '',
        status: (data.status as 'active' | 'completed' | 'abandoned') || 'active',
        createdAt: parseInt(data.createdAt) || 0,
        completedAt: data.completedAt ? parseInt(data.completedAt) : undefined,
        timezone: data.timezone || 'UTC',
        email: data.email,
        activities,
        activityUnits,
      })
    }

    // Sort by createdAt descending (newest first)
    challenges.sort((a, b) => b.createdAt - a.createdAt)

    return NextResponse.json(
      {
        success: true,
        challenges,
        count: challenges.length,
        timestamp: Date.now(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching challenges:', error)
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch challenges',
        timestamp: Date.now(),
      },
      { status: 500 }
    )
  }
}
