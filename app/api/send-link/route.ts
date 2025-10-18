import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { challengeRepository } from '@/lib/challenge/repository'
import { sendChallengeEmail } from '@/lib/email'
import { getRedis } from '@/lib/redis'

const SendLinkRequestSchema = z.object({
  email: z.string().email('Please enter a valid email'),
})

/**
 * POST /api/send-link
 * Send challenge link to email address
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request
    const validation = SendLinkRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'INVALID_EMAIL',
          message: 'Please provide a valid email address',
          details: validation.error.errors,
          timestamp: Date.now(),
        },
        { status: 400 }
      )
    }

    const { email } = validation.data

    // Find challenge(s) associated with this email
    const redis = await getRedis()
    const keys = await redis.keys('challenge:*')

    let foundChallenges: Array<{ id: string; duration: number; activities: string[] }> = []

    for (const key of keys) {
      // Skip non-hash keys (like challenge:xxx:logs)
      if (key.includes(':logs') || key.includes(':metrics')) continue

      const challengeData = await redis.hGetAll(key)
      if (challengeData.email === email) {
        const challengeId = key.replace('challenge:', '')
        const activities = challengeData.activities
          ? JSON.parse(challengeData.activities)
          : ['Push-ups'] // Default for old challenges

        foundChallenges.push({
          id: challengeId,
          duration: parseInt(challengeData.duration),
          activities,
        })
      }
    }

    if (foundChallenges.length === 0) {
      return NextResponse.json(
        {
          error: 'NOT_FOUND',
          message: 'No challenge found for this email address',
          timestamp: Date.now(),
        },
        { status: 404 }
      )
    }

    // Send email for each active challenge found
    // (Most users will only have one, but this handles multiple)
    for (const challenge of foundChallenges) {
      try {
        await sendChallengeEmail({
          to: email,
          challengeId: challenge.id,
          duration: challenge.duration,
          activities: challenge.activities,
          isNew: false, // This is a "forgot link" email
        })
      } catch (error) {
        console.error('Failed to send email for challenge:', challenge.id, error)
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Challenge link sent to ${email}`,
        count: foundChallenges.length,
        timestamp: Date.now(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error sending link:', error)
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Failed to send challenge link',
        timestamp: Date.now(),
      },
      { status: 500 }
    )
  }
}
