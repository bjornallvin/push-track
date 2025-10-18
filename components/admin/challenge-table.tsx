'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Challenge } from '@/lib/challenge/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ChallengeTableProps {
  token: string
}

export function ChallengeTable({ token }: ChallengeTableProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchChallenges() {
      try {
        const response = await fetch('/api/admin/challenges', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch challenges')
        }

        const data = await response.json()
        setChallenges(data.challenges)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load challenges')
      } finally {
        setIsLoading(false)
      }
    }

    fetchChallenges()
  }, [token])

  if (isLoading) {
    return <div className="p-8 text-center">Loading challenges...</div>
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-md bg-destructive/15 p-4 text-destructive">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          {challenges.length} total challenge{challenges.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Activities</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {challenges.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No challenges found
                </TableCell>
              </TableRow>
            ) : (
              challenges.map((challenge) => (
                <TableRow key={challenge.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-mono text-xs">
                    <Link
                      href={`/admin/challenge/${challenge.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {challenge.id.substring(0, 8)}...
                    </Link>
                  </TableCell>
                  <TableCell>{challenge.email || '-'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {challenge.activities.map((activity) => (
                        <span
                          key={activity}
                          className="inline-flex items-center rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300"
                        >
                          {activity}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{challenge.duration} days</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                        challenge.status === 'active'
                          ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                          : challenge.status === 'completed'
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                      }`}
                    >
                      {challenge.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{challenge.startDate}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(challenge.createdAt).toLocaleDateString('sv-SE')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
