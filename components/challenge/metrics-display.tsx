import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MetricsDisplayProps {
  currentDay: number
  duration: number
  streak: number
  personalBest: number
  totalPushups: number
  completionRate: number
}

export function MetricsDisplay({
  currentDay,
  duration,
  streak,
  personalBest,
  totalPushups,
  completionRate,
}: MetricsDisplayProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 hover:shadow-lg transition-all">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">📅</div>
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              Current Day
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
            {currentDay} <span className="text-blue-500 dark:text-blue-400 text-xl">/ {duration}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 hover:shadow-lg transition-all">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">🔥</div>
            <div className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wide">
              Streak
            </div>
          </div>
          <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">
            {streak} <span className="text-orange-500 dark:text-orange-400 text-xl">days</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-yellow-200 dark:border-yellow-800 bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/30 dark:to-yellow-900/20 hover:shadow-lg transition-all">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">🏆</div>
            <div className="text-xs font-medium text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">
              Personal Best
            </div>
          </div>
          <div className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">{personalBest}</div>
        </CardContent>
      </Card>

      <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 hover:shadow-lg transition-all">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">💯</div>
            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
              Total
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{totalPushups}</div>
        </CardContent>
      </Card>

      <Card className="col-span-2 border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-purple-950/30 dark:via-pink-950/20 dark:to-purple-950/30 hover:shadow-lg transition-all">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">
              Completion Rate
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{completionRate}%</div>
          </div>
          <div className="h-4 w-full rounded-full bg-purple-200/50 dark:bg-purple-900/30 overflow-hidden shadow-inner">
            <div
              className="h-4 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 shadow-lg transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
