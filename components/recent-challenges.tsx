'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Trash2 } from 'lucide-react'
import {
  getRecentChallengesSorted,
  removeRecentChallenge,
} from '@/lib/localStorage/recent-challenges'
import type { RecentChallenge } from '@/lib/localStorage/types'
import { sanitizeText } from '@/lib/utils'

export function RecentChallenges() {
  const [mounted, setMounted] = useState(false)
  const [challenges, setChallenges] = useState<RecentChallenge[]>([])

  useEffect(() => {
    setMounted(true)
    const recent = getRecentChallengesSorted()
    setChallenges(recent)
  }, [])

  const handleRemove = (id: string) => {
    removeRecentChallenge(id)
    setChallenges((prev) => prev.filter((c) => c.id !== id))
  }

  // Don't render until mounted (hydration safety)
  if (!mounted) {
    return null
  }

  // Hide section if no challenges
  if (challenges.length === 0) {
    return null
  }

  return (
    <section className="w-full max-w-2xl space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Your Recent Challenges
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Quick access to your active challenges
        </p>
      </div>

      <div className="flex flex-col gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
        {challenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            onRemove={() => handleRemove(challenge.id)}
          />
        ))}
      </div>
    </section>
  )
}

interface ChallengeCardProps {
  challenge: RecentChallenge
  onRemove: () => void
}

function ChallengeCard({ challenge, onRemove }: ChallengeCardProps) {
  const relativeTime = getRelativeTime(challenge.lastVisited)

  return (
    <Card className="border-2 border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700 transition-all hover:shadow-lg group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">
              Your {challenge.duration}-Day Challenge
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              <span className="truncate inline-block max-w-[200px]">
                {sanitizeText(challenge.activities.join(', '))}
              </span>
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.preventDefault()
              onRemove()
            }}
            aria-label="Remove challenge"
          >
            <Trash2 className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Button variant="outline" className="w-full" size="lg" asChild>
          <Link href={challenge.url as any}>
            <Clock className="h-4 w-4 mr-2" />
            Continue
          </Link>
        </Button>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Last visited {relativeTime}
        </p>
      </CardContent>
    </Card>
  )
}

function getRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}
