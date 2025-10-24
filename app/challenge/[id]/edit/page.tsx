import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ActivityLogger } from '@/components/challenge/activity-logger'

interface EditPageProps {
  params: { id: string }
  searchParams: { date?: string }
}

async function getChallengeData(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/challenge/${id}`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error fetching challenge:', error)
    return null
  }
}

async function getLogs(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/challenge/${id}/log`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      return []
    }

    const result = await response.json()
    return result.data.logs || []
  } catch (error) {
    console.error('Error fetching logs:', error)
    return []
  }
}

export default async function EditPage({ params, searchParams }: EditPageProps) {
  const targetDate = searchParams.date || new Date().toISOString().split('T')[0]

  // Fetch real challenge data
  const challengeData = await getChallengeData(params.id)

  if (!challengeData) {
    notFound()
  }

  // Fetch all logs
  const logs = await getLogs(params.id)

  // Filter logs for the target date and build existing values map
  const existingLogs: Record<string, number> = {}
  const targetDateLogs = logs.filter((log: any) => log.date === targetDate)

  // Initialize all activities with 0
  challengeData.activities.forEach((activity: string) => {
    existingLogs[activity] = 0
  })

  // Override with existing log values if they exist
  targetDateLogs.forEach((log: any) => {
    existingLogs[log.activity] = log.reps
  })

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Edit Entry</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Editing date: {targetDate}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/challenge/${params.id}/progress`}>Cancel</Link>
          </Button>
        </div>

        <ActivityLogger
          challengeId={params.id}
          activities={challengeData.activities}
          activityUnits={challengeData.activityUnits}
          yesterdayValues={existingLogs}
          targetDate={targetDate}
          existingLogs={existingLogs}
        />
      </div>
    </main>
  )
}
