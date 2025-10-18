import { Card, CardContent } from '@/components/ui/card'
import { ActivityMetrics } from './activity-metrics'
import type { ActivityUnit } from '@/lib/challenge/types'

const ACTIVITY_COLORS = [
  'purple-pink',
  'blue-cyan',
  'orange-yellow',
  'emerald-green',
  'indigo-violet',
] as const

interface MetricsDisplayProps {
  currentDay: number
  duration: number
  activities: string[]
  activityUnits: Record<string, ActivityUnit>
  activityMetrics: {
    [activity: string]: {
      streak: number
      personalBest: number
      totalReps: number
      completionRate: number
      daysLogged: number
    }
  }
}

export function MetricsDisplay({
  currentDay,
  duration,
  activities,
  activityUnits,
  activityMetrics,
}: MetricsDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Current Day Card - Shared across all activities */}
      <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 hover:shadow-lg transition-all">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">📊</div>
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              Current Day
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
            {currentDay} <span className="text-blue-500 dark:text-blue-400 text-xl">/ {duration}</span>
          </div>
        </CardContent>
      </Card>

      {/* Per-Activity Metrics */}
      <div className="space-y-6">
        {activities.map((activity, index) => {
          const metrics = activityMetrics[activity]
          if (!metrics) return null

          const color = ACTIVITY_COLORS[index % ACTIVITY_COLORS.length]

          return (
            <ActivityMetrics
              key={activity}
              activity={activity}
              streak={metrics.streak}
              personalBest={metrics.personalBest}
              totalReps={metrics.totalReps}
              unit={activityUnits[activity] || 'reps'}
              color={color}
            />
          )
        })}
      </div>
    </div>
  )
}
