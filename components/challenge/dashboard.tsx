import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricsDisplay } from './metrics-display'
import { AbandonButton } from './abandon-button'

interface DashboardProps {
  challengeId: string
  duration: number
  startDate: string
  status: 'active' | 'completed'
  currentDay: number
  metrics: {
    streak: number
    personalBest: number
    totalPushups: number
    daysLogged: number
    completionRate: number
  }
  hasLoggedToday: boolean
}

export function Dashboard({
  challengeId,
  duration,
  startDate,
  status,
  currentDay,
  metrics,
  hasLoggedToday,
}: DashboardProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your {duration}-Day Challenge</CardTitle>
          <CardDescription>
            Started on {new Date(startDate).toLocaleDateString()} • Day {currentDay} of {duration}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {status === 'active' && (
              <>
                {hasLoggedToday ? (
                  <div className="rounded-md bg-green-50 dark:bg-green-950 p-4 text-sm text-green-800 dark:text-green-200">
                    ✓ You&apos;ve logged your pushups for today! Come back tomorrow to continue your streak.
                  </div>
                ) : (
                  <Button asChild size="lg" className="w-full">
                    <Link href={`/challenge/${challengeId}/log`}>
                      Log Today&apos;s Pushups
                    </Link>
                  </Button>
                )}
              </>
            )}

            {status === 'completed' && (
              <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-4 text-sm text-blue-800 dark:text-blue-200">
                🎉 Challenge completed! Check out your completion summary.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <MetricsDisplay
        currentDay={currentDay}
        duration={duration}
        streak={metrics.streak}
        personalBest={metrics.personalBest}
        totalPushups={metrics.totalPushups}
        completionRate={metrics.completionRate}
      />

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Button asChild variant="outline">
            <Link href={`/challenge/${challengeId}/progress`}>
              View Progress Chart
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              Home
            </Link>
          </Button>
        </div>

        {status === 'active' && (
          <AbandonButton challengeId={challengeId} />
        )}
      </div>
    </div>
  )
}
