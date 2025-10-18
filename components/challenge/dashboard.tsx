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
      <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-950 dark:to-purple-950/20 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Your {duration}-Day Challenge</CardTitle>
              <CardDescription className="text-base mt-2 text-gray-700 dark:text-gray-300">
                Started {new Date(startDate).toLocaleDateString()} • Day {currentDay} of {duration}
              </CardDescription>
            </div>
            <div className="text-4xl animate-pulse">💪</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {status === 'active' && (
              <>
                {hasLoggedToday ? (
                  <div className="rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 p-5 text-sm text-green-800 dark:text-green-200 border-2 border-green-300 dark:border-green-800 shadow-lg">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">✓</div>
                      <div>
                        <p className="font-bold mb-1 text-green-900 dark:text-green-100">Maximum logged for today!</p>
                        <p className="text-green-700 dark:text-green-300">
                          Great work! Come back tomorrow to push your limits again.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button asChild size="lg" className="w-full h-14 text-base font-semibold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:via-teal-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all">
                    <Link href={`/challenge/${challengeId}/log`}>
                      💪 Log Today&apos;s Maximum
                    </Link>
                  </Button>
                )}
              </>
            )}

            {status === 'completed' && (
              <div className="rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 p-5 text-sm text-blue-800 dark:text-blue-200 border-2 border-blue-300 dark:border-blue-800 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">🎉</div>
                  <div>
                    <p className="font-bold mb-1 text-blue-900 dark:text-blue-100">Challenge completed!</p>
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
          <Button asChild variant="outline" className="h-12 border-2 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:border-blue-300 dark:hover:border-blue-700 transition-all" size="lg">
            <Link href={`/challenge/${challengeId}/progress`}>
              <span className="text-base font-semibold">📊 Progress</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-12 border-2 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/50 hover:border-purple-300 dark:hover:border-purple-700 transition-all" size="lg">
            <Link href="/">
              <span className="text-base font-semibold">🏠 Home</span>
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
