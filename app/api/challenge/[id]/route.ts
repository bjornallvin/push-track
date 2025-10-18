import { NextRequest, NextResponse } from 'next/server'
import { challengeRepository } from '@/lib/challenge/repository'
import type { GetChallengeResponse } from '@/lib/challenge/types'

/**
 * GET /api/challenge/[id]
 * Get challenge by ID with metrics and yesterday's count
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

    // Get metrics
    const metrics = await challengeRepository.getMetrics(challengeId)

    // Check if logged today
    const hasLoggedToday = await challengeRepository.hasLoggedToday(challengeId)

    // Get yesterday's count for pre-filling
    const yesterdayLog = await challengeRepository.getYesterdayLog(challengeId)

    const response: GetChallengeResponse = {
      id: challenge.id,
      duration: challenge.duration,
      startDate: challenge.startDate,
      status: challenge.status,
      currentDay: metrics.currentDay,
      metrics: {
        streak: metrics.streak,
        personalBest: metrics.personalBest,
        totalPushups: metrics.totalPushups,
        daysLogged: metrics.daysLogged,
        completionRate: metrics.completionRate,
      },
      hasLoggedToday,
      yesterdayCount: yesterdayLog ? yesterdayLog.pushups : null,
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
