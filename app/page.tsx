import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Push Track</h1>
          <p className="mt-2 text-muted-foreground">
            Track your daily pushup progress and build lasting habits
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ready to start?</CardTitle>
            <CardDescription>
              Create a challenge to begin tracking your daily pushup progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="w-full">
              <Link href="/challenge/create">
                Start New Challenge
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h3 className="font-medium text-foreground">1. Set Your Duration</h3>
              <p>Choose how many days you want to track (1-365 days)</p>
            </div>
            <div>
              <h3 className="font-medium text-foreground">2. Log Daily</h3>
              <p>Record your pushup count each day using our simple stepper interface</p>
            </div>
            <div>
              <h3 className="font-medium text-foreground">3. Track Progress</h3>
              <p>Visualize your progress with charts and track your streak</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
