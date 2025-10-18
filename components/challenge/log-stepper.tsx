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
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Log Today&apos;s Pushups</CardTitle>
        <CardDescription>
          Use the stepper to set your pushup count for today
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
          className="w-full"
          size="lg"
          disabled={isLoading || success}
        >
          {isLoading ? 'Logging...' : 'Log Pushups'}
        </Button>
      </CardContent>
    </Card>
  )
}
