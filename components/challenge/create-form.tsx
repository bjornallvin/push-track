'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const formSchema = z.object({
  duration: z.coerce
    .number()
    .int()
    .min(1, 'Challenge must be at least 1 day')
    .max(365, 'Challenge cannot exceed 365 days'),
})

type FormData = z.infer<typeof formSchema>

export function ChallengeForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      duration: 30,
    },
  })

  async function onSubmit(values: FormData) {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create challenge')
      }

      // Redirect to challenge dashboard
      router.push(`/challenge/${data.data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-2 shadow-lg">
      <CardHeader className="space-y-3">
        <CardTitle className="text-2xl">Start Your Challenge</CardTitle>
        <CardDescription className="text-base">
          Commit to doing <span className="font-semibold text-foreground">one set of maximum pushups</span> every day
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
              <p className="font-medium">💪 The Challenge</p>
              <p className="text-muted-foreground">
                Each day, do as many pushups as you can in one continuous set. Log your max number and watch your strength grow over time.
              </p>
            </div>

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">How many days?</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="30"
                      {...field}
                      className="h-12 text-lg" // Touch target compliance
                    />
                  </FormControl>
                  <FormDescription>
                    Choose between 1 and 365 days
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Start Challenge'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
