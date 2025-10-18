import { NextRequest, NextResponse } from 'next/server'
import { challengeRepository } from '@/lib/challenge/repository'
import type { GetChallengeResponse } from '@/lib/challenge/types'

/**
 * GET /api/challenge/[id]
 * Get challenge by ID with per-activity metrics and yesterday's counts
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const challengeId = params.id

    // Get challenge
    const challenge = await challengeRepository.getChallenge(challengeId)

    if (!challenge) {
      return NextResponse.json(
        {
          error: 'NO_ACTIVE_CHALLENGE',
          message: 'Challenge not found',
          timestamp: Date.now(),
        },
        { status: 404 }
      )
    }

    // Get metrics for all activities
    const metricsMap = await challengeRepository.getAllActivityMetrics(challengeId)

    // Build activity metrics response
    const activityMetrics: GetChallengeResponse['activityMetrics'] = {}

    for (const activity of challenge.activities) {
      const metrics = metricsMap.get(activity)
      if (!metrics) continue

      // Check if logged today for this activity
      const hasLoggedToday = await challengeRepository.hasLoggedToday(challengeId, activity)

      // Get yesterday's count for this activity
      const yesterdayLog = await challengeRepository.getYesterdayLog(challengeId, activity)

      activityMetrics[activity] = {
        streak: metrics.streak,
        personalBest: metrics.personalBest,
        totalReps: metrics.totalReps,
        daysLogged: metrics.daysLogged,
        completionRate: metrics.completionRate,
        hasLoggedToday,
        yesterdayCount: yesterdayLog ? yesterdayLog.reps : null,
      }
    }

    // Get current day from first activity metrics
    const firstActivityMetrics = metricsMap.get(challenge.activities[0])
    const currentDay = firstActivityMetrics?.currentDay ?? 1

    const response: GetChallengeResponse = {
      id: challenge.id,
      duration: challenge.duration,
      startDate: challenge.startDate,
      status: challenge.status,
      currentDay,
      activities: challenge.activities,
      activityUnits: challenge.activityUnits || {},
      activityMetrics,
    }

    return NextResponse.json(
      {
        success: true,
        data: response,
        timestamp: Date.now(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching challenge:', error)
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch challenge',
        timestamp: Date.now(),
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/challenge/[id]
 * Abandon (delete) challenge
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const challengeId = params.id

    // Check if challenge exists
    const challenge = await challengeRepository.getChallenge(challengeId)

    if (!challenge) {
      return NextResponse.json(
        {
          error: 'NO_ACTIVE_CHALLENGE',
          message: 'No challenge found to abandon',
          timestamp: Date.now(),
        },
        { status: 404 }
      )
    }

    // Delete challenge
    await challengeRepository.abandonChallenge(challengeId)

    return NextResponse.json(
      {
        success: true,
        data: {
          message: 'Challenge abandoned successfully',
        },
        timestamp: Date.now(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error abandoning challenge:', error)
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Failed to abandon challenge',
        timestamp: Date.now(),
      },
      { status: 500 }
    )
  }
}
