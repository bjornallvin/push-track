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

    // Get logs for best day calculation
    const logsResponse = await fetch(`${baseUrl}/api/challenge/${id}/log`, {
      cache: 'no-store',
    })

    if (!logsResponse.ok) {
      return null
    }

    const logsData = await logsResponse.json()
    const logs = logsData.data.logs

    // Find best day
    const bestLog = logs.reduce(
      (best: any, log: any) => (log.pushups > best.pushups ? log : best),
      logs[0] || { date: challenge.startDate, pushups: 0 }
    )

    return {
      totalPushups: challenge.metrics.totalPushups,
      completionRate: challenge.metrics.completionRate,
      bestDay: {
        date: bestLog.date,
        pushups: bestLog.pushups,
      },
      finalStreak: challenge.metrics.streak,
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
