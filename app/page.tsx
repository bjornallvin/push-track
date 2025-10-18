import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-2xl w-full space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
            Daily Strength Challenge
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Push Your Limits
          </h1>
          <p className="text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Challenge yourself to do <span className="font-semibold text-foreground">one set of maximum pushups</span> every single day. Track your progress and watch your strength grow.
          </p>
        </div>

        {/* CTA Card */}
        <Card className="border-2 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Start Your Challenge</CardTitle>
            <CardDescription className="text-base">
              Commit to daily maximum effort and build unstoppable momentum
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="w-full h-14 text-base font-semibold">
              <Link href="/challenge/create">
                Begin Challenge
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* How It Works */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center">How It Works</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-muted">
              <CardContent className="pt-6 space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl mb-3">
                  1
                </div>
                <h3 className="font-semibold text-lg">Choose Duration</h3>
                <p className="text-sm text-muted-foreground">
                  Set your challenge length from 1 to 365 days
                </p>
              </CardContent>
            </Card>
            <Card className="border-muted">
              <CardContent className="pt-6 space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl mb-3">
                  2
                </div>
                <h3 className="font-semibold text-lg">Max Out Daily</h3>
                <p className="text-sm text-muted-foreground">
                  Do one set of maximum pushups and log your count
                </p>
              </CardContent>
            </Card>
            <Card className="border-muted">
              <CardContent className="pt-6 space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl mb-3">
                  3
                </div>
                <h3 className="font-semibold text-lg">Watch Growth</h3>
                <p className="text-sm text-muted-foreground">
                  Track your progress with charts and celebrate streaks
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Key Features */}
        <Card className="bg-muted/30 border-muted">
          <CardContent className="pt-6">
            <div className="grid gap-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="text-primary text-xl">💪</div>
                <div>
                  <p className="font-medium">One set, maximum effort</p>
                  <p className="text-muted-foreground">Push yourself to the limit once per day</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-primary text-xl">📊</div>
                <div>
                  <p className="font-medium">Visual progress tracking</p>
                  <p className="text-muted-foreground">See your strength increase over time</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-primary text-xl">🔥</div>
                <div>
                  <p className="font-medium">Build streaks</p>
                  <p className="text-muted-foreground">Stay consistent and watch your momentum build</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
