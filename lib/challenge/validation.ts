import { z } from 'zod'

/**
 * Zod validation schemas for the Multi-Activity Challenge Tracker
 */

// Activity unit types
export const ActivityUnitSchema = z.enum([
  'reps',
  'minutes',
  'seconds',
  'km',
  'miles',
  'meters',
  'hours',
])

// Activity name validation (1-30 chars, Unicode letters + numbers + spaces + hyphens)
// Supports international characters including Swedish (å, ä, ö)
export const ActivityNameSchema = z
  .string()
  .min(1, 'Activity name must be at least 1 character')
  .max(30, 'Activity name must be at most 30 characters')
  .regex(
    /^[\p{L}\p{N}\s\-]+$/u,
    'Activity name must contain only letters, numbers, spaces, and hyphens'
  )

// Activity units map validation (maps activity name to unit)
export const ActivityUnitsSchema = z.record(ActivityNameSchema, ActivityUnitSchema)

// Activities array validation (1-5 unique activities)
export const ActivitiesArraySchema = z
  .array(ActivityNameSchema)
  .min(1, 'At least one activity is required')
  .max(5, 'Maximum 5 activities allowed')
  .refine(
    (activities) => {
      const lowerCased = activities.map((a) => a.toLowerCase())
      return new Set(lowerCased).size === lowerCased.length
    },
    { message: 'Activity names must be unique (case-insensitive)' }
  )

// Challenge validation
export const ChallengeSchema = z.object({
  id: z.string().uuid(),
  duration: z.number().int().min(1).max(365),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['active', 'completed', 'abandoned']),
  createdAt: z.number().int().positive(),
  completedAt: z.number().int().positive().optional(),
  timezone: z.string().min(1),
  email: z.string().email().optional(),
  activities: ActivitiesArraySchema,
  activityUnits: ActivityUnitsSchema.optional(), // Optional for backward compatibility
})

// Daily log validation
export const DailyLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  activity: ActivityNameSchema,
  reps: z.number().int().min(0).max(10000),
  timestamp: z.number().int().positive(),
  timezone: z.string().min(1),
  // Deprecated field for backward compatibility
  pushups: z.number().int().min(0).max(10000).optional(),
})

// Progress metrics validation
export const ProgressMetricsSchema = z.object({
  currentDay: z.number().int().min(1),
  streak: z.number().int().min(0),
  personalBest: z.number().int().min(0).max(10000),
  totalPushups: z.number().int().min(0),
  daysLogged: z.number().int().min(0),
  daysMissed: z.number().int().min(0),
  completionRate: z.number().int().min(0).max(100),
  calculatedAt: z.number().int().positive(),
})

// Per-activity metrics validation
export const ActivityMetricsSchema = z.object({
  activity: ActivityNameSchema,
  currentDay: z.number().int().min(1),
  streak: z.number().int().min(0),
  personalBest: z.number().int().min(0).max(10000),
  totalReps: z.number().int().min(0),
  daysLogged: z.number().int().min(0),
  daysMissed: z.number().int().min(0),
  completionRate: z.number().int().min(0).max(100),
  calculatedAt: z.number().int().positive(),
})

// API Request validation schemas
export const CreateChallengeRequestSchema = z.object({
  duration: z.number().int().min(1).max(365),
  email: z.string().email().optional().or(z.literal('')),
  activities: ActivitiesArraySchema,
  activityUnits: ActivityUnitsSchema,
})

export const LogRepsRequestSchema = z.object({
  logs: z
    .array(
      z.object({
        activity: ActivityNameSchema,
        reps: z.number().int().min(0).max(10000),
      })
    )
    .min(1, 'At least one activity must be logged')
    .max(5, 'Maximum 5 activities can be logged'),
})

// Deprecated - use LogRepsRequestSchema instead
export const LogPushupsRequestSchema = z.object({
  pushups: z.number().int().min(0).max(10000),
})

// Type inference from schemas
export type ValidatedChallenge = z.infer<typeof ChallengeSchema>
export type ValidatedDailyLog = z.infer<typeof DailyLogSchema>
export type ValidatedProgressMetrics = z.infer<typeof ProgressMetricsSchema>
export type ValidatedActivityMetrics = z.infer<typeof ActivityMetricsSchema>
export type ValidatedCreateChallengeRequest = z.infer<typeof CreateChallengeRequestSchema>
export type ValidatedLogRepsRequest = z.infer<typeof LogRepsRequestSchema>
export type ValidatedLogPushupsRequest = z.infer<typeof LogPushupsRequestSchema>
export type ValidatedActivityName = z.infer<typeof ActivityNameSchema>
export type ValidatedActivitiesArray = z.infer<typeof ActivitiesArraySchema>
export type ValidatedActivityUnit = z.infer<typeof ActivityUnitSchema>
export type ValidatedActivityUnits = z.infer<typeof ActivityUnitsSchema>
