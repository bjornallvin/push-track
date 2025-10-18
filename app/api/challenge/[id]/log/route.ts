import { NextRequest, NextResponse } from 'next/server'
import { challengeRepository } from '@/lib/challenge/repository'
import { LogPushupsRequestSchema } from '@/lib/challenge/validation'
import type { LogPushupsResponse } from '@/lib/challenge/types'

/**
 * POST /api/challenge/[id]/log
 * Log pushups for today
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const challengeId = params.id
    const body = await request.json()

    // Validate request
    const validation = LogPushupsRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'INVALID_PUSHUP_COUNT',
          message: 'Pushup count must be between 0 and 10,000',
          details: validation.error.errors,
          timestamp: Date.now(),
        },
        { status: 400 }
      )
    }

    const { pushups } = validation.data

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

    if (challenge.status !== 'active') {
      return NextResponse.json(
        {
          error: 'CHALLENGE_COMPLETED',
          message: 'Cannot log pushups for a completed challenge',
          timestamp: Date.now(),
        },
        { status: 403 }
      )
    }

    // Log pushups
    try {
      const log = await challengeRepository.logPushups(challengeId, pushups)

      // Recalculate metrics
      const metrics = await challengeRepository.calculateAndCacheMetrics(
        challengeId
      )

      // Check if challenge is now complete
      const isComplete = await challengeRepository.checkAndUpdateCompletion(
        challengeId
      )

      const response: LogPushupsResponse = {
        date: log.date,
        pushups: log.pushups,
        metrics: {
          streak: metrics.streak,
          personalBest: metrics.personalBest,
          currentDay: metrics.currentDay,
        },
        challengeCompleted: isComplete,
      }

      return NextResponse.json(
        {
          success: true,
          data: response,
          timestamp: Date.now(),
        },
        { status: 201 }
      )
    } catch (error) {
      if (error instanceof Error && error.message === 'Already logged pushups for today') {
        return NextResponse.json(
          {
            error: 'ALREADY_LOGGED_TODAY',
            message: 'You have already logged pushups for today. Try again tomorrow!',
            timestamp: Date.now(),
          },
          { status: 409 }
        )
      }
      throw error
    }
  } catch (error) {
    console.error('Error logging pushups:', error)
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Failed to log pushups',
        timestamp: Date.now(),
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/challenge/[id]/log
 * Get all logs for a challenge
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

    // Get all logs
    const logs = await challengeRepository.getAllLogs(challengeId)
    const metrics = await challengeRepository.getMetrics(challengeId)

    return NextResponse.json(
      {
        success: true,
        data: {
          logs: logs.map((log) => ({
            date: log.date,
            pushups: log.pushups,
            timestamp: log.timestamp,
          })),
          challenge: {
            startDate: challenge.startDate,
            duration: challenge.duration,
            currentDay: metrics.currentDay,
          },
        },
        timestamp: Date.now(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching logs:', error)
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch logs',
        timestamp: Date.now(),
      },
      { status: 500 }
    )
  }
}
