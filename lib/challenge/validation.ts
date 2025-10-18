import { z } from 'zod'

/**
 * Zod validation schemas for the Pushup Challenge Tracker
 */

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
})

// Daily log validation
export const DailyLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pushups: z.number().int().min(0).max(10000),
  timestamp: z.number().int().positive(),
  timezone: z.string().min(1),
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

// API Request validation schemas
export const CreateChallengeRequestSchema = z.object({
  duration: z.number().int().min(1).max(365),
  email: z.string().email().optional().or(z.literal('')),
})

export const LogPushupsRequestSchema = z.object({
  pushups: z.number().int().min(0).max(10000),
})

// Type inference from schemas
export type ValidatedChallenge = z.infer<typeof ChallengeSchema>
export type ValidatedDailyLog = z.infer<typeof DailyLogSchema>
export type ValidatedProgressMetrics = z.infer<typeof ProgressMetricsSchema>
export type ValidatedCreateChallengeRequest = z.infer<typeof CreateChallengeRequestSchema>
export type ValidatedLogPushupsRequest = z.infer<typeof LogPushupsRequestSchema>
