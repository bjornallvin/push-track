'use client'

import { useState } from 'react'
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
  email: z.string().email('Please enter a valid email'),
})

type FormData = z.infer<typeof formSchema>

export function ForgotLinkForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  })

  async function onSubmit(values: FormData) {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/send-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No challenge found for this email address')
        }
        throw new Error(data.message || 'Failed to send link')
      }

      setSuccess(true)
      form.reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-2 border-cyan-200 dark:border-cyan-800 bg-gradient-to-br from-white to-cyan-50/50 dark:from-gray-950 dark:to-cyan-950/30 shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
          Lost Your Challenge Link?
        </CardTitle>
        <CardDescription className="text-base text-gray-700 dark:text-gray-300">
          Enter your email and we&apos;ll send you your challenge link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      {...field}
                      className="h-11"
                    />
                  </FormControl>
                  <FormDescription>
                    We&apos;ll send your challenge link to this email
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

            {success && (
              <div className="rounded-lg bg-green-50 dark:bg-green-950 p-3 text-sm text-green-800 dark:text-green-200 border border-green-200 dark:border-green-900">
                ✓ Check your email! We&apos;ve sent you your challenge link.
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all"
              disabled={isLoading || success}
            >
              {isLoading ? '📧 Sending...' : '📧 Send Me My Link'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
