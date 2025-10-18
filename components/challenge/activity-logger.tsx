'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { ActivityUnit } from '@/lib/challenge/types'

const ACTIVITY_COLORS = [
  'purple-pink',
  'blue-cyan',
  'orange-yellow',
  'emerald-green',
  'indigo-violet',
] as const

const GRADIENTS = {
  'purple-pink': 'from-purple-600 to-pink-600',
  'blue-cyan': 'from-blue-600 to-cyan-600',
  'orange-yellow': 'from-orange-600 to-yellow-600',
  'emerald-green': 'from-emerald-600 to-green-600',
  'indigo-violet': 'from-indigo-600 to-violet-600',
}

interface ActivityLoggerProps {
  challengeId: string
  activities: string[]
  activityUnits: Record<string, ActivityUnit>
  yesterdayValues: Record<string, number>
}

export function ActivityLogger({
  challengeId,
  activities,
  activityUnits,
  yesterdayValues,
}: ActivityLoggerProps) {
  const router = useRouter()

  // Initialize activity reps with yesterday's values
  const [activityReps, setActivityReps] = useState<Record<string, number>>(() => {
    const initialValues: Record<string, number> = {}
    activities.forEach((activity) => {
      initialValues[activity] = yesterdayValues[activity] ?? 0
    })
    return initialValues
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function increment(activity: string) {
    setActivityReps((prev) => ({
      ...prev,
      [activity]: Math.min((prev[activity] ?? 0) + 1, 10000),
    }))
  }

  function decrement(activity: string) {
    setActivityReps((prev) => ({
      ...prev,
      [activity]: Math.max((prev[activity] ?? 0) - 1, 0),
    }))
  }

  async function handleSubmit() {
    setIsLoading(true)
    setError(null)

    try {
      // Build logs array
      const logs = activities.map((activity) => ({
        activity,
        reps: activityReps[activity] ?? 0,
      }))

      const response = await fetch(`/api/challenge/${challengeId}/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to log activities')
      }

      setSuccess(true)

      // Redirect back to dashboard after a short delay
      setTimeout(() => {
        router.push(`/challenge/${challengeId}`)
        router.refresh() // Refresh the page data
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-2 border-emerald-200 dark:border-emerald-800 shadow-2xl shadow-emerald-500/20 bg-gradient-to-br from-white to-emerald-50/50 dark:from-gray-950 dark:to-emerald-950/30">
      <CardHeader className="space-y-3">
        <CardTitle className="text-2xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Log Today&apos;s Activities
        </CardTitle>
        <CardDescription className="text-base text-gray-700 dark:text-gray-300">
          Enter your numbers for each activity today
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-2 border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm space-y-2 text-center">
          <p className="font-semibold text-amber-900 dark:text-amber-100">💡 Remember</p>
          <p className="text-amber-700 dark:text-amber-300">
            Log your maximum reps for each activity. Give it everything you&apos;ve got!
          </p>
        </div>

        {/* Activity Steppers */}
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const gradient = GRADIENTS[ACTIVITY_COLORS[index % ACTIVITY_COLORS.length]]
            const reps = activityReps[activity] ?? 0
            const unit = activityUnits[activity] || 'reps'

            return (
              <div
                key={activity}
                className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/30 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                  {activity}
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => decrement(activity)}
                    disabled={reps === 0 || isLoading || success}
                    className="h-12 w-12"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>

                  <div className="flex-1 text-center">
                    <div className={`text-4xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                      {reps}
                    </div>
                    <div className="text-xs text-muted-foreground">{unit}</div>
                  </div>

                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => increment(activity)}
                    disabled={reps === 10000 || isLoading || success}
                    className="h-12 w-12"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 dark:bg-green-950 p-3 text-sm text-green-800 dark:text-green-200">
            ✓ Activities logged successfully! Redirecting...
          </div>
        )}

        <Button
          onClick={handleSubmit}
          className="w-full h-12 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:via-teal-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all"
          size="lg"
          disabled={isLoading || success}
        >
          {isLoading ? '⏳ Logging...' : '✅ Log All Activities'}
        </Button>
      </CardContent>
    </Card>
  )
}
