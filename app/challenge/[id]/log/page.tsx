import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ActivityLogger } from '@/components/challenge/activity-logger'
import { Button } from '@/components/ui/button'

async function getChallenge(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/challenge/${id}`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error fetching challenge:', error)
    return null
  }
}

export default async function LogPage({
  params,
}: {
  params: { id: string }
}) {
  const challenge = await getChallenge(params.id)

  if (!challenge) {
    notFound()
  }

  // Check if all activities have been logged today
  const allActivitiesLogged = challenge.activities.every(
    (activity: string) => challenge.activityMetrics[activity]?.hasLoggedToday
  )

  // If already logged all activities today, redirect to dashboard
  if (allActivitiesLogged) {
    redirect(`/challenge/${params.id}`)
  }

  // Build yesterday values for each activity
  const yesterdayValues: Record<string, number> = {}
  challenge.activities.forEach((activity: string) => {
    yesterdayValues[activity] = challenge.activityMetrics[activity]?.yesterdayCount ?? 0
  })

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <ActivityLogger
          challengeId={params.id}
          activities={challenge.activities}
          activityUnits={challenge.activityUnits || {}}
          yesterdayValues={yesterdayValues}
        />

        <Button asChild variant="outline" className="w-full">
          <Link href={`/challenge/${params.id}`}>
            Cancel
          </Link>
        </Button>
      </div>
    </main>
  )
}
