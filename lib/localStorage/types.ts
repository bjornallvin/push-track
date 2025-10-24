import { z } from 'zod'

/**
 * Zod schema for runtime validation of RecentChallenge objects.
 * Ensures localStorage data integrity even if modified by devtools/extensions.
 */
export const RecentChallengeSchema = z.object({
  id: z.string().uuid({
    message: 'Challenge ID must be a valid UUID',
  }),

  activities: z
    .array(z.string().min(1).max(100))
    .min(1, 'At least one activity required')
    .max(5, 'Maximum 5 activities allowed'),

  duration: z
    .number()
    .int('Duration must be an integer')
    .min(1, 'Minimum duration is 1 day')
    .max(365, 'Maximum duration is 365 days'),

  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),

  lastVisited: z
    .number()
    .int('lastVisited must be an integer')
    .positive('lastVisited must be a positive timestamp'),

  url: z.string().startsWith('/challenge/', {
    message: 'URL must start with /challenge/',
  }),
})

/**
 * TypeScript type inferred from Zod schema.
 * Use this for type annotations to ensure schema/type alignment.
 */
export type RecentChallenge = z.infer<typeof RecentChallengeSchema>

/**
 * Zod schema for the versioned localStorage wrapper.
 */
export const StorageDataSchema = z.object({
  version: z.number().int().positive(),
  challenges: z.array(RecentChallengeSchema),
})

export type StorageData = z.infer<typeof StorageDataSchema>
