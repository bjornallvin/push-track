import { NextRequest, NextResponse } from 'next/server'
import { challengeRepository } from '@/lib/challenge/repository'
import { CreateChallengeRequestSchema } from '@/lib/challenge/validation'
import { getUserTimezone } from '@/lib/utils'
import { sendChallengeEmail } from '@/lib/email'
import type { CreateChallengeResponse } from '@/lib/challenge/types'

/**
 * POST /api/challenge
 * Create a new pushup challenge
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request
    const validation = CreateChallengeRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'INVALID_DURATION',
          message: 'Duration must be between 1 and 365 days',
          details: validation.error.errors,
          timestamp: Date.now(),
        },
        { status: 400 }
      )
    }

    const { duration, email } = validation.data
    const timezone = getUserTimezone()

    // Create challenge
    const challengeId = await challengeRepository.createChallenge(
      duration,
      timezone,
      email || undefined
    )

    // Send email if provided
    if (email) {
      try {
        await sendChallengeEmail({
          to: email,
          challengeId,
          duration,
          isNew: true,
        })
      } catch (error) {
        console.error('Failed to send email, but challenge was created:', error)
        // Don't fail the request if email fails
      }
    }

    // Get the created challenge
    const challenge = await challengeRepository.getChallenge(challengeId)

    if (!challenge) {
      throw new Error('Failed to create challenge')
    }

    const response: CreateChallengeResponse = {
      id: challenge.id,
      duration: challenge.duration,
      startDate: challenge.startDate,
      status: 'active',
      currentDay: 1,
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
    console.error('Error creating challenge:', error)
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Failed to create challenge',
        timestamp: Date.now(),
      },
      { status: 500 }
    )
  }
}
