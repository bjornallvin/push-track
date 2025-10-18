import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ForgotLinkForm } from '@/components/forgot-link-form'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      <div className="max-w-2xl w-full space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-block rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-1.5 text-sm font-medium text-white mb-4 shadow-lg">
            💪 Daily Strength Challenge
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-in fade-in duration-1000">
            Push Your Limits
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-lg mx-auto leading-relaxed">
            Challenge yourself to do <span className="font-bold text-purple-600 dark:text-purple-400">one set of maximum pushups</span> every single day. Track your progress and watch your strength grow.
          </p>
        </div>

        {/* CTA Card */}
        <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-2xl shadow-purple-500/20 bg-gradient-to-br from-white to-purple-50/50 dark:from-gray-950 dark:to-purple-950/30">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Start Your Challenge</CardTitle>
            <CardDescription className="text-base text-gray-600 dark:text-gray-400">
              Commit to daily maximum effort and build unstoppable momentum
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="w-full h-14 text-base font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all">
              <Link href="/challenge/create">
                🚀 Begin Challenge
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* How It Works */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">How It Works</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 hover:shadow-lg hover:scale-105 transition-all">
              <CardContent className="pt-6 space-y-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl mb-3 shadow-lg">
                  1
                </div>
                <h3 className="font-semibold text-lg text-blue-900 dark:text-blue-100">Choose Duration</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Set your challenge length from 1 to 365 days
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 hover:shadow-lg hover:scale-105 transition-all">
              <CardContent className="pt-6 space-y-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl mb-3 shadow-lg">
                  2
                </div>
                <h3 className="font-semibold text-lg text-purple-900 dark:text-purple-100">Max Out Daily</h3>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Do one set of maximum pushups and log your count
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-pink-200 dark:border-pink-800 bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-950/30 dark:to-pink-900/20 hover:shadow-lg hover:scale-105 transition-all">
              <CardContent className="pt-6 space-y-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center text-white font-bold text-xl mb-3 shadow-lg">
                  3
                </div>
                <h3 className="font-semibold text-lg text-pink-900 dark:text-pink-100">Watch Growth</h3>
                <p className="text-sm text-pink-700 dark:text-pink-300">
                  Track your progress with charts and celebrate streaks
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Key Features */}
        <Card className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/20 dark:via-amber-950/20 dark:to-yellow-950/20 border-2 border-orange-200 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="grid gap-4 text-sm">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/60 dark:bg-gray-900/60 border border-orange-200 dark:border-orange-900">
                <div className="text-3xl">💪</div>
                <div>
                  <p className="font-semibold text-orange-900 dark:text-orange-100">One set, maximum effort</p>
                  <p className="text-orange-700 dark:text-orange-300">Push yourself to the limit once per day</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/60 dark:bg-gray-900/60 border border-emerald-200 dark:border-emerald-900">
                <div className="text-3xl">📊</div>
                <div>
                  <p className="font-semibold text-emerald-900 dark:text-emerald-100">Visual progress tracking</p>
                  <p className="text-emerald-700 dark:text-emerald-300">See your strength increase over time</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/60 dark:bg-gray-900/60 border border-red-200 dark:border-red-900">
                <div className="text-3xl">🔥</div>
                <div>
                  <p className="font-semibold text-red-900 dark:text-red-100">Build streaks</p>
                  <p className="text-red-700 dark:text-red-300">Stay consistent and watch your momentum build</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Forgot Link Section */}
        <ForgotLinkForm />
      </div>
    </main>
  )
}
