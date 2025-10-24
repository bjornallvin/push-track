import { NextRequest, NextResponse } from 'next/server'
import { challengeRepository } from '@/lib/challenge/repository'
import { LogRepsRequestSchema } from '@/lib/challenge/validation'
import type { LogRepsResponse } from '@/lib/challenge/types'

/**
 * POST /api/challenge/[id]/log
 * Log reps for all activities today
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const challengeId = params.id
    const body = await request.json()

    // Validate request
    const validation = LogRepsRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'INVALID_REQUEST',
          message: 'Invalid log data',
          details: validation.error.errors,
          timestamp: Date.now(),
        },
        { status: 400 }
      )
    }

    const { logs, date } = validation.data

    // Determine if we're in edit mode
    const isEditMode = !!date
    const targetDate = date || undefined

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

    // Validate date range if date parameter is provided
    if (date) {
      const targetDateObj = new Date(date)
      const startDateObj = new Date(challenge.startDate)
      const today = new Date()
      today.setHours(23, 59, 59, 999) // End of today

      if (targetDateObj < startDateObj) {
        return NextResponse.json(
          {
            error: 'VALIDATION_ERROR',
            message: `Date ${date} is before challenge start date ${challenge.startDate}`,
            timestamp: Date.now(),
          },
          { status: 400 }
        )
      }

      if (targetDateObj > today) {
        return NextResponse.json(
          {
            error: 'VALIDATION_ERROR',
            message: 'Cannot edit future dates',
            timestamp: Date.now(),
          },
          { status: 400 }
        )
      }
    }

    // Skip completion check if in edit mode (allow editing completed challenges)
    if (challenge.status !== 'active' && !isEditMode) {
      return NextResponse.json(
        {
          error: 'CHALLENGE_COMPLETED',
          message: 'Cannot log reps for a completed challenge',
          timestamp: Date.now(),
        },
        { status: 403 }
      )
    }

    // Verify all challenge activities are included in the request
    const loggedActivities = new Set(logs.map((l) => l.activity))
    const missingActivities = challenge.activities.filter((a) => !loggedActivities.has(a))

    if (missingActivities.length > 0) {
      return NextResponse.json(
        {
          error: 'MISSING_ACTIVITIES',
          message: `All activities must be logged: ${missingActivities.join(', ')}`,
          timestamp: Date.now(),
        },
        { status: 400 }
      )
    }

    // Verify no extra activities are logged
    const extraActivities = logs.filter((l) => !challenge.activities.includes(l.activity))
    if (extraActivities.length > 0) {
      return NextResponse.json(
        {
          error: 'INVALID_ACTIVITIES',
          message: `Invalid activities: ${extraActivities.map((l) => l.activity).join(', ')}`,
          timestamp: Date.now(),
        },
        { status: 400 }
      )
    }

    // Log reps for each activity
    const loggedEntries: Array<{ date: string; activity: string; reps: number }> = []
    const activityMetrics: LogRepsResponse['activityMetrics'] = {}

    try {
      for (const { activity, reps } of logs) {
        const log = await challengeRepository.logReps(
          challengeId,
          activity,
          reps,
          targetDate,
          isEditMode
        )
        loggedEntries.push({
          date: log.date,
          activity: log.activity,
          reps: log.reps,
        })

        // Recalculate metrics for this activity
        const metrics = await challengeRepository.calculateAndCacheMetrics(
          challengeId,
          activity
        )

        activityMetrics[activity] = {
          streak: metrics.streak,
          personalBest: metrics.personalBest,
          totalReps: metrics.totalReps,
          currentDay: metrics.currentDay,
        }
      }

      // Check if challenge is now complete
      const isComplete = await challengeRepository.checkAndUpdateCompletion(challengeId)

      const response: LogRepsResponse = {
        logs: loggedEntries,
        activityMetrics,
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
      if (error instanceof Error && error.message.includes('Already logged')) {
        return NextResponse.json(
          {
            error: 'ALREADY_LOGGED_TODAY',
            message: 'You have already logged activities for today. Try again tomorrow!',
            timestamp: Date.now(),
          },
          { status: 409 }
        )
      }
      throw error
    }
  } catch (error) {
    console.error('Error logging reps:', error)
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Failed to log reps',
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

    // Get metrics for first activity to get currentDay
    const firstActivityMetrics = await challengeRepository.getMetricsForActivity(
      challengeId,
      challenge.activities[0]
    )

    return NextResponse.json(
      {
        success: true,
        data: {
          logs: logs.map((log) => ({
            date: log.date,
            activity: log.activity,
            reps: log.reps,
            timestamp: log.timestamp,
          })),
          challenge: {
            startDate: challenge.startDate,
            duration: challenge.duration,
            currentDay: firstActivityMetrics.currentDay,
            activities: challenge.activities,
            activityUnits: challenge.activityUnits || {},
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
