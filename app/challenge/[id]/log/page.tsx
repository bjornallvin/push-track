import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { LogStepper } from '@/components/challenge/log-stepper'
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

  // If already logged today, redirect to dashboard
  if (challenge.hasLoggedToday) {
    redirect(`/challenge/${params.id}`)
  }

  // Use yesterday's count as default, or 0 if no yesterday count
  const defaultValue = challenge.yesterdayCount ?? 0

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <LogStepper
          challengeId={params.id}
          defaultValue={defaultValue}
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
