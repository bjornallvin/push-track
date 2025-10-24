'use client'

import { useEffect } from 'react'
import { saveRecentChallenge } from '@/lib/localStorage/recent-challenges'
import { challengeToRecentChallenge } from '@/lib/localStorage/utils'
import type { Challenge } from '@/lib/challenge/types'

interface Props {
  challenge: Challenge
}

/**
 * Invisible component that saves challenge to localStorage on mount.
 * Placed in challenge page Server Component.
 */
export function SaveToRecent({ challenge }: Props) {
  useEffect(() => {
    const recent = challengeToRecentChallenge(challenge)
    saveRecentChallenge(recent)
  }, [challenge])

  return null // No UI
}
