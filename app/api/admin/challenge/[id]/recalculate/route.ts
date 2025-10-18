import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthHeader } from '@/lib/admin/auth'
import { challengeRepository } from '@/lib/challenge/repository'

/**
 * POST /api/admin/challenge/[id]/recalculate
 * Force recalculation of metrics for all activities in a challenge
 */
export async function POST(
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

    // Recalculate metrics for all activities
    const recalculated: Record<string, any> = {}
    for (const activity of challenge.activities) {
      const metrics = await challengeRepository.calculateAndCacheMetrics(
        challengeId,
        activity
      )
      recalculated[activity] = metrics
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Metrics recalculated successfully',
        metrics: recalculated,
        timestamp: Date.now(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error recalculating metrics:', error)
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Failed to recalculate metrics',
        timestamp: Date.now(),
      },
      { status: 500 }
    )
  }
}
