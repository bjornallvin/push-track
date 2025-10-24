import { notFound, redirect } from 'next/navigation'
import { Dashboard } from '@/components/challenge/dashboard'
import { SaveToRecent } from '@/components/challenge/save-to-recent'

async function getChallenge(id: string) {
  try {
    // In a server component, we can fetch directly
    // For local development, use relative URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/challenge/${id}`, {
      cache: 'no-store', // Always get fresh data
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

export default async function ChallengePage({
  params,
}: {
  params: { id: string }
}) {
  const challenge = await getChallenge(params.id)

  if (!challenge) {
    notFound()
  }

  // Redirect to completion page if challenge is completed
  if (challenge.status === 'completed') {
    redirect(`/challenge/${params.id}/complete`)
  }

  return (
    <>
      {/* Invisible component to save to localStorage */}
      <SaveToRecent challenge={challenge} />

      <main className="min-h-screen p-4 md:p-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-8 text-3xl font-bold">Challenge Tracker</h1>
          <Dashboard {...challenge} challengeId={params.id} />
        </div>
      </main>
    </>
  )
}
