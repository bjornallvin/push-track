import type { Challenge } from '@/lib/challenge/types'
import type { RecentChallenge } from './types'

/**
 * Convert full Challenge object to RecentChallenge for localStorage.
 */
export function challengeToRecentChallenge(
  challenge: Challenge
): RecentChallenge {
  return {
    id: challenge.id,
    activities: challenge.activities,
    duration: challenge.duration,
    startDate: challenge.startDate,
    lastVisited: Date.now(),
    url: `/challenge/${challenge.id}`,
  }
}
