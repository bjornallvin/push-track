'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface LogStepperProps {
  challengeId: string
  defaultValue?: number
}

export function LogStepper({ challengeId, defaultValue = 0 }: LogStepperProps) {
  const router = useRouter()
  const [pushups, setPushups] = useState(defaultValue)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function increment() {
    setPushups((prev) => Math.min(prev + 1, 10000))
  }

  function decrement() {
    setPushups((prev) => Math.max(prev - 1, 0))
  }

  async function handleSubmit() {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/challenge/${challengeId}/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pushups }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to log pushups')
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
        <CardTitle className="text-2xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Log Today&apos;s Maximum</CardTitle>
        <CardDescription className="text-base text-gray-700 dark:text-gray-300">
          How many pushups did you do in your <span className="font-bold text-emerald-600 dark:text-emerald-400">one maximum set</span> today?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-2 border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm space-y-2 text-center">
          <p className="font-semibold text-amber-900 dark:text-amber-100">💡 Remember</p>
          <p className="text-amber-700 dark:text-amber-300">
            This is your max effort in one continuous set. Give it everything you&apos;ve got!
          </p>
        </div>
        <div className="flex items-center justify-center gap-4">
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={decrement}
            disabled={pushups === 0 || isLoading || success}
            className="h-14 w-14"
          >
            <Minus className="h-6 w-6" />
          </Button>

          <div className="min-w-[120px] text-center">
            <div className="text-6xl font-bold">{pushups}</div>
            <div className="text-sm text-muted-foreground">pushups</div>
          </div>

          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={increment}
            disabled={pushups === 10000 || isLoading || success}
            className="h-14 w-14"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 dark:bg-green-950 p-3 text-sm text-green-800 dark:text-green-200">
            ✓ Pushups logged successfully! Redirecting...
          </div>
        )}

        <Button
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:via-teal-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all"
          size="lg"
          disabled={isLoading || success}
        >
          {isLoading ? '⏳ Logging...' : '✅ Log Pushups'}
        </Button>
      </CardContent>
    </Card>
  )
}
