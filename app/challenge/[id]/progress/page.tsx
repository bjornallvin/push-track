import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProgressChart } from '@/components/challenge/progress-chart'
import { Button } from '@/components/ui/button'

async function getLogs(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/challenge/${id}/log`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error fetching logs:', error)
    return null
  }
}

export default async function ProgressPage({
  params,
}: {
  params: { id: string }
}) {
  const data = await getLogs(params.id)

  if (!data) {
    notFound()
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Progress</h1>
          <Button asChild variant="outline">
            <Link href={`/challenge/${params.id}`}>
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <ProgressChart
          logs={data.logs}
          startDate={data.challenge.startDate}
          duration={data.challenge.duration}
          currentDay={data.challenge.currentDay}
          activities={data.challenge.activities}
          activityUnits={data.challenge.activityUnits}
        />
      </div>
    </main>
  )
}
