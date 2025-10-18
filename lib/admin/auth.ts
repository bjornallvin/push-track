import { NextRequest } from 'next/server'

/**
 * Verify if the provided password matches the admin password
 */
export function verifyPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminPassword) {
    console.error('ADMIN_PASSWORD not set in environment variables')
    return false
  }

  return password === adminPassword
}

/**
 * Verify if the provided token matches the admin token
 */
export function verifyToken(token: string): boolean {
  const adminToken = process.env.ADMIN_TOKEN

  if (!adminToken) {
    console.error('ADMIN_TOKEN not set in environment variables')
    return false
  }

  return token === adminToken
}

/**
 * Extract and verify token from Authorization header
 * Returns true if valid, false otherwise
 */
export function verifyAuthHeader(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')

  if (!authHeader) {
    return false
  }

  // Expected format: "Bearer {token}"
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return false
  }

  return verifyToken(parts[1])
}

/**
 * Get the admin token from environment
 * Used after successful password verification
 */
export function getAdminToken(): string | null {
  return process.env.ADMIN_TOKEN || null
}
