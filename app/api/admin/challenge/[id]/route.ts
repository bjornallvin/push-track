import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyAuthHeader } from '@/lib/admin/auth'
import { challengeRepository } from '@/lib/challenge/repository'
import { getRedis } from '@/lib/redis'
import { ActivityUnitSchema } from '@/lib/challenge/validation'

const UpdateChallengeSchema = z.object({
  duration: z.number().int().min(1).max(365).optional(),
  status: z.enum(['active', 'completed', 'abandoned']).optional(),
  email: z.string().email().optional(),
  activities: z.array(z.string()).min(1).max(5).optional(),
  activityUnits: z.record(z.string(), ActivityUnitSchema).optional(),
})

/**
 * GET /api/admin/challenge/[id]
 * Get challenge details with all logs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const challengeId = params.id
    const challenge = await challengeRepository.getChallenge(challengeId)

    if (!challenge) {
      return NextResponse.json(
        {
          error: 'NOT_FOUND',
          message: 'Challenge not found',
          timestamp: Date.now(),
        },
        { status: 404 }
      )
    }

    // Get all logs for this challenge
    const logs = await challengeRepository.getAllLogs(challengeId)

    return NextResponse.json(
      {
        success: true,
        challenge,
        logs,
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
 * PUT /api/admin/challenge/[id]
 * Update challenge details
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const challengeId = params.id
    const body = await request.json()

    // Validate request
    const validation = UpdateChallengeSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'INVALID_REQUEST',
          message: 'Invalid update data',
          details: validation.error.errors,
          timestamp: Date.now(),
        },
        { status: 400 }
      )
    }

    // Check challenge exists
    const challenge = await challengeRepository.getChallenge(challengeId)
    if (!challenge) {
      return NextResponse.json(
        {
          error: 'NOT_FOUND',
          message: 'Challenge not found',
          timestamp: Date.now(),
        },
        { status: 404 }
      )
    }

    const redis = await getRedis()
    const updates: Record<string, string> = {}

    // Build update object
    if (validation.data.duration !== undefined) {
      updates.duration = validation.data.duration.toString()
    }
    if (validation.data.status !== undefined) {
      updates.status = validation.data.status
      if (validation.data.status === 'completed' && !challenge.completedAt) {
        updates.completedAt = Date.now().toString()
      }
    }
    if (validation.data.email !== undefined) {
      updates.email = validation.data.email
    }
    if (validation.data.activities !== undefined) {
      updates.activities = JSON.stringify(validation.data.activities)
    }
    if (validation.data.activityUnits !== undefined) {
      updates.activityUnits = JSON.stringify(validation.data.activityUnits)
    }

    // Update in Redis
    if (Object.keys(updates).length > 0) {
      await redis.hSet(`challenge:${challengeId}`, updates)
    }

    // Get updated challenge
    const updatedChallenge = await challengeRepository.getChallenge(challengeId)

    return NextResponse.json(
      {
        success: true,
        challenge: updatedChallenge,
        timestamp: Date.now(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating challenge:', error)
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Failed to update challenge',
        timestamp: Date.now(),
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/challenge/[id]
 * Delete a challenge and all its data
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const challengeId = params.id

    // Check challenge exists
    const challenge = await challengeRepository.getChallenge(challengeId)
    if (!challenge) {
      return NextResponse.json(
        {
          error: 'NOT_FOUND',
          message: 'Challenge not found',
          timestamp: Date.now(),
        },
        { status: 404 }
      )
    }

    const redis = await getRedis()

    // Delete all related keys
    await redis.del(`challenge:${challengeId}`)
    await redis.del(`challenge:${challengeId}:logs`)

    // Delete all metric keys for each activity
    if (challenge.activities) {
      for (const activity of challenge.activities) {
        await redis.del(`challenge:${challengeId}:metrics:${activity}`)
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Challenge deleted successfully',
        timestamp: Date.now(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting challenge:', error)
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Failed to delete challenge',
        timestamp: Date.now(),
      },
      { status: 500 }
    )
  }
}
