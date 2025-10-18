import Link from 'next/link'
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
  'purple-pink': 'from-purple-50 to-pink-100/50 dark:from-purple-950/30 dark:to-pink-900/20',
  'blue-cyan': 'from-blue-50 to-cyan-100/50 dark:from-blue-950/30 dark:to-cyan-900/20',
  'orange-yellow': 'from-orange-50 to-yellow-100/50 dark:from-orange-950/30 dark:to-yellow-900/20',
  'emerald-green': 'from-emerald-50 to-green-100/50 dark:from-emerald-950/30 dark:to-green-900/20',
  'indigo-violet': 'from-indigo-50 to-violet-100/50 dark:from-indigo-950/30 dark:to-violet-900/20',
}

const BORDER_COLORS = {
  'purple-pink': 'border-purple-200 dark:border-purple-800',
  'blue-cyan': 'border-blue-200 dark:border-blue-800',
  'orange-yellow': 'border-orange-200 dark:border-orange-800',
  'emerald-green': 'border-emerald-200 dark:border-emerald-800',
  'indigo-violet': 'border-indigo-200 dark:border-indigo-800',
}

const TEXT_COLORS = {
  'purple-pink': {
    title: 'text-purple-900 dark:text-purple-100',
    value: 'text-purple-600 dark:text-purple-400',
  },
  'blue-cyan': {
    title: 'text-blue-900 dark:text-blue-100',
    value: 'text-blue-600 dark:text-blue-400',
  },
  'orange-yellow': {
    title: 'text-orange-900 dark:text-orange-100',
    value: 'text-orange-600 dark:text-orange-400',
  },
  'emerald-green': {
    title: 'text-emerald-900 dark:text-emerald-100',
    value: 'text-emerald-600 dark:text-emerald-400',
  },
  'indigo-violet': {
    title: 'text-indigo-900 dark:text-indigo-100',
    value: 'text-indigo-600 dark:text-indigo-400',
  },
}

interface CompletionSummaryProps {
  activities: string[]
  activityStats: Record<string, {
    totalReps: number
    bestDay: {
      date: string
      reps: number
    }
    finalStreak: number
    completionRate: number
  }>
  activityUnits: Record<string, ActivityUnit>
  duration: number
  startDate: string
}

export function CompletionSummary({
  activities,
  activityStats,
  activityUnits,
  duration,
  startDate,
}: CompletionSummaryProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-white to-purple-50/50 dark:from-gray-950 dark:to-purple-950/30 shadow-xl">
        <CardHeader>
          <CardTitle className="text-center text-3xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            🎉 Challenge Complete!
          </CardTitle>
          <CardDescription className="text-center text-base text-gray-700 dark:text-gray-300">
            Congratulations on completing your {duration}-day challenge!
          </CardDescription>
          <CardDescription className="text-center text-sm text-gray-600 dark:text-gray-400">
            Started {new Date(startDate).toLocaleDateString('sv-SE')}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Per-Activity Stats */}
      {activities.map((activity, index) => {
        const stats = activityStats[activity]
        if (!stats) return null

        const unit = activityUnits[activity] || 'reps'
        const color = ACTIVITY_COLORS[index % ACTIVITY_COLORS.length]
        const gradient = GRADIENTS[color]
        const borderColor = BORDER_COLORS[color]
        const colors = TEXT_COLORS[color]

        return (
          <div key={activity} className="space-y-3">
            <h3 className={`text-lg font-bold ${colors.title}`}>{activity}</h3>

            <div className="grid grid-cols-3 gap-3">
              <Card className={`border-2 ${borderColor} bg-gradient-to-br ${gradient} hover:shadow-lg transition-all`}>
                <CardHeader className="pb-2">
                  <CardTitle className={`text-sm font-medium ${colors.value} uppercase tracking-wide`}>
                    Total {unit}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${colors.title}`}>{stats.totalReps}</div>
                </CardContent>
              </Card>

              <Card className={`border-2 ${borderColor} bg-gradient-to-br ${gradient} hover:shadow-lg transition-all`}>
                <CardHeader className="pb-2">
                  <CardTitle className={`text-sm font-medium ${colors.value} uppercase tracking-wide`}>
                    Best Day
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${colors.title}`}>{stats.bestDay.reps} {unit}</div>
                  <div className={`text-xs ${colors.value} mt-1`}>
                    {new Date(stats.bestDay.date).toLocaleDateString('sv-SE')}
                  </div>
                </CardContent>
              </Card>

              <Card className={`border-2 ${borderColor} bg-gradient-to-br ${gradient} hover:shadow-lg transition-all`}>
                <CardHeader className="pb-2">
                  <CardTitle className={`text-sm font-medium ${colors.value} uppercase tracking-wide`}>
                    Final Streak
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${colors.title}`}>{stats.finalStreak}</div>
                  <div className={`text-xs ${colors.value} mt-1`}>days</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )
      })}

      {/* CTA */}
      <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20">
        <CardContent className="pt-6">
          <Button asChild className="w-full h-14 text-base font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all" size="lg">
            <Link href="/">
              🚀 Start New Challenge
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
