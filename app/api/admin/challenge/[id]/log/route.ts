import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyAuthHeader } from '@/lib/admin/auth'
import { getRedis } from '@/lib/redis'
import { challengeRepository } from '@/lib/challenge/repository'
import type { DailyLog } from '@/lib/challenge/types'

const UpdateLogSchema = z.object({
  timestamp: z.number(), // Used to identify which log to update
  date: z.string().optional(),
  activity: z.string().optional(),
  reps: z.number().int().min(0).optional(),
  delete: z.boolean().optional(), // If true, delete this log
})

/**
 * PUT /api/admin/challenge/[id]/log
 * Update or delete a specific log entry
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
    const validation = UpdateLogSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'INVALID_REQUEST',
          message: 'Invalid log update data',
          details: validation.error.errors,
          timestamp: Date.now(),
        },
        { status: 400 }
      )
    }

    const { timestamp, delete: shouldDelete, ...updates } = validation.data

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

    // Get all logs
    const logs = await challengeRepository.getAllLogs(challengeId)

    // Find the log with matching timestamp
    const logToUpdate = logs.find((log) => log.timestamp === timestamp)
    if (!logToUpdate) {
      return NextResponse.json(
        {
          error: 'NOT_FOUND',
          message: 'Log entry not found',
          timestamp: Date.now(),
        },
        { status: 404 }
      )
    }

    if (shouldDelete) {
      // Delete the log
      // Remove from sorted set by value (the JSON string)
      const oldLogJson = JSON.stringify(logToUpdate)
      await redis.zRem(`challenge:${challengeId}:logs`, oldLogJson)

      return NextResponse.json(
        {
          success: true,
          message: 'Log deleted successfully',
          timestamp: Date.now(),
        },
        { status: 200 }
      )
    } else {
      // Update the log
      const updatedLog: DailyLog = {
        ...logToUpdate,
        ...updates,
      }

      // Remove old log from sorted set
      const oldLogJson = JSON.stringify(logToUpdate)
      await redis.zRem(`challenge:${challengeId}:logs`, oldLogJson)

      // Add updated log to sorted set
      const dateTimestamp = new Date(updatedLog.date).getTime()
      await redis.zAdd(`challenge:${challengeId}:logs`, {
        score: dateTimestamp,
        value: JSON.stringify(updatedLog),
      })

      return NextResponse.json(
        {
          success: true,
          log: updatedLog,
          timestamp: Date.now(),
        },
        { status: 200 }
      )
    }
  } catch (error) {
    console.error('Error updating log:', error)
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Failed to update log',
        timestamp: Date.now(),
      },
      { status: 500 }
    )
  }
}
