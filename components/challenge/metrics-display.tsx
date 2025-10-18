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
      <Card className="border-muted">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl">📅</div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Current Day
            </div>
          </div>
          <div className="text-3xl font-bold">
            {currentDay} <span className="text-muted-foreground text-xl">/ {duration}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-muted">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl">🔥</div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Streak
            </div>
          </div>
          <div className="text-3xl font-bold">
            {streak} <span className="text-muted-foreground text-xl">days</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-muted">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl">🏆</div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Personal Best
            </div>
          </div>
          <div className="text-3xl font-bold">{personalBest}</div>
        </CardContent>
      </Card>

      <Card className="border-muted">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl">💯</div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total
            </div>
          </div>
          <div className="text-3xl font-bold">{totalPushups}</div>
        </CardContent>
      </Card>

      <Card className="col-span-2 border-muted bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Completion Rate
            </div>
            <div className="text-2xl font-bold text-primary">{completionRate}%</div>
          </div>
          <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
