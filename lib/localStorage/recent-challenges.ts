import { STORAGE_KEY, STORAGE_VERSION } from './constants'
import { StorageDataSchema, RecentChallengeSchema } from './types'
import type { RecentChallenge, StorageData } from './types'

/**
 * Save a challenge to localStorage.
 * Updates existing entry if challenge ID already exists.
 */
export function saveRecentChallenge(challenge: RecentChallenge): void {
  try {
    // Validate input
    const validated = RecentChallengeSchema.parse(challenge)

    // Load existing challenges
    const existing = getRecentChallenges()

    // Remove duplicate (same ID) and prepend new entry
    const updated = [
      validated,
      ...existing.filter((c) => c.id !== validated.id),
    ]

    // Wrap in versioned structure
    const data: StorageData = {
      version: STORAGE_VERSION,
      challenges: updated,
    }

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    if (error instanceof DOMException) {
      // localStorage unavailable (QuotaExceeded, SecurityError, etc.)
      console.warn('localStorage unavailable:', error.name)
    } else {
      console.error('Failed to save challenge to localStorage:', error)
    }
  }
}

/**
 * Load all recent challenges from localStorage.
 * Returns empty array if data is corrupted or unavailable.
 */
export function getRecentChallenges(): RecentChallenge[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)

    // Validate structure
    const validated = StorageDataSchema.safeParse(parsed)
    if (!validated.success) {
      console.warn('Invalid localStorage data, clearing:', validated.error)
      localStorage.removeItem(STORAGE_KEY)
      return []
    }

    // Check version
    if (validated.data.version !== STORAGE_VERSION) {
      console.warn('localStorage schema version mismatch, clearing')
      localStorage.removeItem(STORAGE_KEY)
      return []
    }

    return validated.data.challenges
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.warn('Corrupted localStorage data, clearing')
      localStorage.removeItem(STORAGE_KEY)
    } else if (error instanceof DOMException) {
      console.warn('localStorage unavailable:', error.name)
    } else {
      console.error('Failed to load challenges from localStorage:', error)
    }
    return []
  }
}

/**
 * Get recent challenges sorted by lastVisited (descending).
 */
export function getRecentChallengesSorted(): RecentChallenge[] {
  const challenges = getRecentChallenges()
  return challenges.sort((a, b) => b.lastVisited - a.lastVisited)
}

/**
 * Remove a challenge by ID.
 */
export function removeRecentChallenge(id: string): void {
  try {
    const existing = getRecentChallenges()
    const filtered = existing.filter((c) => c.id !== id)

    const data: StorageData = {
      version: STORAGE_VERSION,
      challenges: filtered,
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to remove challenge from localStorage:', error)
  }
}

/**
 * Clear all recent challenges.
 */
export function clearRecentChallenges(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear localStorage:', error)
  }
}
