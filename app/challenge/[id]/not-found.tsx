import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ChallengeNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Challenge Not Found</CardTitle>
          <CardDescription>
            This challenge doesn&apos;t exist or has expired
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/">
              Go Home
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
