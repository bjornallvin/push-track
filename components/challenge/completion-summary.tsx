import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface CompletionSummaryProps {
  totalPushups: number
  completionRate: number
  bestDay: {
    date: string
    pushups: number
  }
  finalStreak: number
  duration: number
  startDate: string
}

export function CompletionSummary({
  totalPushups,
  completionRate,
  bestDay,
  finalStreak,
  duration,
  startDate,
}: CompletionSummaryProps) {
  return (
    <div className="space-y-6">
      <Card className="border-primary">
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-center text-3xl">
            🎉 Challenge Complete!
          </CardTitle>
          <CardDescription className="text-center">
            Congratulations on completing your {duration}-day challenge!
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pushups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalPushups}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completionRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Best Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{bestDay.pushups}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {new Date(bestDay.date).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Final Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{finalStreak} days</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-sm text-muted-foreground mb-4">
            You started on {new Date(startDate).toLocaleDateString()} and completed all {duration} days!
          </p>
          <Button asChild className="w-full" size="lg">
            <Link href="/">
              Start New Challenge
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
