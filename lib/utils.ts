import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function for merging Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Date utility functions for timezone handling
 */

/**
 * Get the user's IANA timezone (e.g., "America/New_York")
 * Falls back to "UTC" if detection fails
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch (error) {
    console.error('Failed to detect timezone:', error)
    return 'UTC'
  }
}

/**
 * Get today's date in YYYY-MM-DD format (local timezone)
 * This is the canonical way to get "today" for day boundary calculations
 */
export function getTodayLocalDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Format a Date object to YYYY-MM-DD string (local timezone)
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get yesterday's date in YYYY-MM-DD format (local timezone)
 * Used for pre-filling the stepper input
 */
export function getYesterdayLocalDate(): string {
  const now = new Date()
  now.setDate(now.getDate() - 1)
  return formatLocalDate(now)
}

/**
 * Parse YYYY-MM-DD string to Date object (local timezone)
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Calculate the number of days between two YYYY-MM-DD date strings
 * Returns positive number if endDate is after startDate
 */
export function daysBetween(startDate: string, endDate: string): number {
  const start = parseLocalDate(startDate)
  const end = parseLocalDate(endDate)
  const diffTime = end.getTime() - start.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Add days to a YYYY-MM-DD date string
 * Returns new date string in YYYY-MM-DD format
 */
export function addDays(dateString: string, days: number): string {
  const date = parseLocalDate(dateString)
  date.setDate(date.getDate() + days)
  return formatLocalDate(date)
}

/**
 * Check if a date string is valid YYYY-MM-DD format
 */
export function isValidDateString(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateString)) return false

  const date = parseLocalDate(dateString)
  return !isNaN(date.getTime())
}
