import { Card, CardContent } from '@/components/ui/card'
import type { ActivityUnit } from '@/lib/challenge/types'

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
    accent: 'text-purple-500 dark:text-purple-400',
  },
  'blue-cyan': {
    title: 'text-blue-900 dark:text-blue-100',
    value: 'text-blue-600 dark:text-blue-400',
    accent: 'text-blue-500 dark:text-blue-400',
  },
  'orange-yellow': {
    title: 'text-orange-900 dark:text-orange-100',
    value: 'text-orange-600 dark:text-orange-400',
    accent: 'text-orange-500 dark:text-orange-400',
  },
  'emerald-green': {
    title: 'text-emerald-900 dark:text-emerald-100',
    value: 'text-emerald-600 dark:text-emerald-400',
    accent: 'text-emerald-500 dark:text-emerald-400',
  },
  'indigo-violet': {
    title: 'text-indigo-900 dark:text-indigo-100',
    value: 'text-indigo-600 dark:text-indigo-400',
    accent: 'text-indigo-500 dark:text-indigo-400',
  },
}

type ColorScheme = keyof typeof GRADIENTS

interface ActivityMetricsProps {
  activity: string
  streak: number
  personalBest: number
  totalReps: number
  unit: ActivityUnit
  color?: ColorScheme
}

export function ActivityMetrics({
  activity,
  streak,
  personalBest,
  totalReps,
  unit,
  color = 'purple-pink',
}: ActivityMetricsProps) {
  const gradient = GRADIENTS[color]
  const borderColor = BORDER_COLORS[color]
  const colors = TEXT_COLORS[color]

  return (
    <div className="space-y-3">
      {/* Activity Header */}
      <h3 className={`text-lg font-bold ${colors.title}`}>{activity}</h3>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Streak */}
        <Card className={`border-2 ${borderColor} bg-gradient-to-br ${gradient} hover:shadow-lg transition-all`}>
          <CardContent className="pt-4 pb-4 px-3">
            <div className="flex flex-col items-center gap-1">
              <div className="text-2xl">🔥</div>
              <div className={`text-2xl font-bold ${colors.title}`}>{streak}</div>
              <div className={`text-xs font-medium ${colors.value} uppercase tracking-wide`}>
                Streak
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Best */}
        <Card className={`border-2 ${borderColor} bg-gradient-to-br ${gradient} hover:shadow-lg transition-all`}>
          <CardContent className="pt-4 pb-4 px-3">
            <div className="flex flex-col items-center gap-1">
              <div className="text-2xl">🏆</div>
              <div className={`text-2xl font-bold ${colors.title}`}>{personalBest}</div>
              <div className={`text-xs font-medium ${colors.value} uppercase tracking-wide`}>
                Best
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total */}
        <Card className={`border-2 ${borderColor} bg-gradient-to-br ${gradient} hover:shadow-lg transition-all`}>
          <CardContent className="pt-4 pb-4 px-3">
            <div className="flex flex-col items-center gap-1">
              <div className="text-2xl">💯</div>
              <div className={`text-2xl font-bold ${colors.title}`}>{totalReps}</div>
              <div className={`text-xs font-medium ${colors.value} uppercase tracking-wide`}>
                Total {unit}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
