import { notFound } from 'next/navigation'
import { CompletionSummary } from '@/components/challenge/completion-summary'

async function getCompletionSummary(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Get challenge to check if completed
    const challengeResponse = await fetch(`${baseUrl}/api/challenge/${id}`, {
      cache: 'no-store',
    })

    if (!challengeResponse.ok) {
      return null
    }

    const challengeData = await challengeResponse.json()
    const challenge = challengeData.data

    if (challenge.status !== 'completed') {
      return null
    }

    // Get logs for best day calculation per activity
    const logsResponse = await fetch(`${baseUrl}/api/challenge/${id}/log`, {
      cache: 'no-store',
    })

    if (!logsResponse.ok) {
      return null
    }

    const logsData = await logsResponse.json()
    const logs = logsData.data.logs

    // Calculate per-activity stats
    const activityStats: Record<string, { totalReps: number; bestDay: { date: string; reps: number }; finalStreak: number; completionRate: number }> = {}

    for (const activity of challenge.activities) {
      const activityLogs = logs.filter((log: any) => log.activity === activity)
      const metrics = challenge.activityMetrics[activity]

      // Find best day for this activity
      const bestLog = activityLogs.reduce(
        (best: any, log: any) => ((log.reps ?? log.pushups ?? 0) > (best.reps ?? best.pushups ?? 0) ? log : best),
        activityLogs[0] || { date: challenge.startDate, reps: 0 }
      )

      activityStats[activity] = {
        totalReps: metrics.totalReps,
        bestDay: {
          date: bestLog.date,
          reps: bestLog.reps ?? bestLog.pushups ?? 0,
        },
        finalStreak: metrics.streak,
        completionRate: metrics.completionRate,
      }
    }

    return {
      activities: challenge.activities,
      activityStats,
      activityUnits: challenge.activityUnits || {},
      duration: challenge.duration,
      startDate: challenge.startDate,
    }
  } catch (error) {
    console.error('Error fetching completion summary:', error)
    return null
  }
}

export default async function CompletePage({
  params,
}: {
  params: { id: string }
}) {
  const summary = await getCompletionSummary(params.id)

  if (!summary) {
    notFound()
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        <CompletionSummary {...summary} />
      </div>
    </main>
  )
}
