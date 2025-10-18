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
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Your {duration}-Day Challenge</CardTitle>
              <CardDescription className="text-base mt-2">
                Started {new Date(startDate).toLocaleDateString()} • Day {currentDay} of {duration}
              </CardDescription>
            </div>
            <div className="text-4xl">💪</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {status === 'active' && (
              <>
                {hasLoggedToday ? (
                  <div className="rounded-lg bg-green-50 dark:bg-green-950 p-5 text-sm text-green-800 dark:text-green-200 border border-green-200 dark:border-green-900">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">✓</div>
                      <div>
                        <p className="font-semibold mb-1">Maximum logged for today!</p>
                        <p className="text-green-700 dark:text-green-300">
                          Great work! Come back tomorrow to push your limits again.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button asChild size="lg" className="w-full h-14 text-base font-semibold">
                    <Link href={`/challenge/${challengeId}/log`}>
                      Log Today&apos;s Maximum
                    </Link>
                  </Button>
                )}
              </>
            )}

            {status === 'completed' && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-5 text-sm text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-900">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🎉</div>
                  <div>
                    <p className="font-semibold mb-1">Challenge completed!</p>
                    <p className="text-blue-700 dark:text-blue-300">
                      Amazing job! Check out your completion summary to see how far you&apos;ve come.
                    </p>
                  </div>
                </div>
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
          <Button asChild variant="outline" className="h-12" size="lg">
            <Link href={`/challenge/${challengeId}/progress`}>
              📊 Progress
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-12" size="lg">
            <Link href="/">
              🏠 Home
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
