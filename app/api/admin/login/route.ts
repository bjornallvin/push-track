import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyPassword, getAdminToken } from '@/lib/admin/auth'

const LoginRequestSchema = z.object({
  password: z.string().min(1, 'Password is required'),
})

/**
 * POST /api/admin/login
 * Verify admin password and return token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request
    const validation = LoginRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'INVALID_REQUEST',
          message: 'Invalid request data',
          details: validation.error.errors,
          timestamp: Date.now(),
        },
        { status: 400 }
      )
    }

    const { password } = validation.data

    // Verify password
    if (!verifyPassword(password)) {
      return NextResponse.json(
        {
          error: 'INVALID_PASSWORD',
          message: 'Invalid admin password',
          timestamp: Date.now(),
        },
        { status: 401 }
      )
    }

    // Get and return token
    const token = getAdminToken()
    if (!token) {
      return NextResponse.json(
        {
          error: 'SERVER_ERROR',
          message: 'Admin token not configured',
          timestamp: Date.now(),
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        token,
        timestamp: Date.now(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in admin login:', error)
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Failed to process login',
        timestamp: Date.now(),
      },
      { status: 500 }
    )
  }
}
