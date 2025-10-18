# Data Model: Pushup Challenge Tracker

**Date**: 2025-10-18
**Storage**: Redis (Upstash)
**Session-Based**: No authentication, single challenge per session

---

## Overview

The data model uses Redis key-value store with session-based isolation. Each browser session has a unique session ID stored in an HttpOnly cookie. Data is organized using Redis data structures optimized for our access patterns.

---

## Redis Key Structure

```
session:{sessionId}                     → Hash: Session metadata
session:{sessionId}:challenge           → Hash: Active challenge
session:{sessionId}:logs                → Sorted Set: Daily logs (sorted by date)
session:{sessionId}:metrics             → Hash: Cached metrics
```

---

## Entity Definitions

### 1. Session

**Purpose**: Track session metadata and activity for TTL management

**Redis Structure**: Hash
**Key**: `session:{sessionId}`
**TTL**: Tiered (30/90/365 days based on activity)

**Fields**:
```typescript
interface Session {
  id: string              // Session UUID
  createdAt: number       // Unix timestamp (ms)
  lastActivity: number    // Unix timestamp (ms)
  timezone: string        // IANA timezone (e.g., "America/New_York")
}
```

**Redis Representation**:
```redis
HSET session:abc123 id "abc123"
HSET session:abc123 createdAt "1710518400000"
HSET session:abc123 lastActivity "1710604800000"
HSET session:abc123 timezone "America/New_York"
EXPIRE session:abc123 2592000  # 30 days
```

**Validation Rules**:
- `id`: UUID v4 format
- `createdAt`: Must be <= current time
- `lastActivity`: Must be >= createdAt
- `timezone`: Must be valid IANA timezone

**Access Patterns**:
- Create on first visit
- Read on every request (check expiration)
- Update `lastActivity` on every write operation
- Delete on TTL expiration

---

### 2. Challenge

**Purpose**: Store challenge configuration and status

**Redis Structure**: Hash
**Key**: `session:{sessionId}:challenge`
**TTL**: Inherits from session TTL

**Fields**:
```typescript
interface Challenge {
  id: string              // Challenge UUID
  sessionId: string       // Parent session ID
  duration: number        // Challenge length in days (1-365)
  startDate: string       // YYYY-MM-DD in user's local timezone
  status: 'active' | 'completed' | 'abandoned'
  createdAt: number       // Unix timestamp (ms)
  completedAt?: number    // Unix timestamp (ms), null if not completed
}
```

**Redis Representation**:
```redis
HSET session:abc123:challenge id "ch_xyz789"
HSET session:abc123:challenge sessionId "abc123"
HSET session:abc123:challenge duration "30"
HSET session:abc123:challenge startDate "2024-03-15"
HSET session:abc123:challenge status "active"
HSET session:abc123:challenge createdAt "1710518400000"
```

**Validation Rules**:
- `duration`: Integer, 1-365 inclusive (FR-002)
- `startDate`: YYYY-MM-DD format, must be valid calendar date
- `status`: Must be one of: 'active', 'completed', 'abandoned'
- `createdAt`: Must be <= current time
- `completedAt`: If present, must be >= createdAt

**State Transitions**:
```
active → completed  (when current day > startDate + duration)
active → abandoned  (when user explicitly abandons via FR-016)
```

**Access Patterns**:
- Create once per session (FR-013: only one active challenge)
- Read on every page load (check if active challenge exists)
- Update status when challenge completes or is abandoned
- Delete when creating new challenge (previous challenge data not retained)

---

### 3. Daily Log Entry

**Purpose**: Track daily pushup counts

**Redis Structure**: Sorted Set
**Key**: `session:{sessionId}:logs`
**Score**: Unix timestamp of the log date at midnight UTC (for sorting)
**Member**: JSON-encoded log entry
**TTL**: Inherits from session TTL

**Fields**:
```typescript
interface DailyLog {
  date: string            // YYYY-MM-DD in user's local timezone
  pushups: number         // Pushup count (0-10,000)
  timestamp: number       // Unix timestamp (ms) when logged
  timezone: string        // User's timezone at time of logging
}
```

**Redis Representation**:
```redis
# Sorted set: score is date as Unix timestamp, value is JSON
ZADD session:abc123:logs 1710460800 '{"date":"2024-03-15","pushups":50,"timestamp":1710518400000,"timezone":"America/New_York"}'
ZADD session:abc123:logs 1710547200 '{"date":"2024-03-16","pushups":55,"timestamp":1710604800000,"timezone":"America/New_York"}'
```

**Validation Rules**:
- `date`: YYYY-MM-DD format, must match calendar date in user's timezone
- `pushups`: Integer, 0-10,000 inclusive (FR-007)
- `timestamp`: Must be <= current time
- `timezone`: Must be valid IANA timezone
- **Uniqueness**: Only one log per date (FR-005)
- **No retroactive logging**: Cannot log for past dates (FR-006)
- **Current day only**: Can only log for getTodayLocalDate() (FR-006)

**Access Patterns**:
- Insert: Once per day per challenge (FR-004, FR-005)
- Read all: Get all logs for chart display (FR-009)
- Read today: Check if already logged today (FR-005)
- Read yesterday: Pre-fill stepper input (FR-022)
- Range query: Get logs for specific date range

**Query Examples**:
```typescript
// Get all logs (sorted by date ascending)
const logs = await redis.zrange('session:abc123:logs', 0, -1)

// Get logs for last 7 days
const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
const recentLogs = await redis.zrangebyscore('session:abc123:logs', sevenDaysAgo, Date.now())

// Count total logs
const count = await redis.zcard('session:abc123:logs')

// Get yesterday's log (most recent before today)
const allLogs = await redis.zrange('session:abc123:logs', -2, -2)
```

---

### 4. Progress Metrics (Calculated)

**Purpose**: Cache calculated metrics for performance

**Redis Structure**: Hash
**Key**: `session:{sessionId}:metrics`
**TTL**: Invalidated and recalculated on each log submission

**Fields**:
```typescript
interface ProgressMetrics {
  currentDay: number          // Day number in challenge (e.g., 5 for "Day 5 of 30")
  streak: number              // Consecutive days with non-zero pushups (FR-020)
  personalBest: number        // Highest single-day pushup count
  totalPushups: number        // Sum of all logged pushups
  daysLogged: number          // Count of days with any log entry
  daysMissed: number          // Count of days without log entry (up to current day)
  completionRate: number      // Percentage: (daysLogged / currentDay) * 100 (FR-024)
  calculatedAt: number        // Unix timestamp (ms) when metrics were calculated
}
```

**Redis Representation**:
```redis
HSET session:abc123:metrics currentDay "10"
HSET session:abc123:metrics streak "7"
HSET session:abc123:metrics personalBest "75"
HSET session:abc123:metrics totalPushups "525"
HSET session:abc123:metrics daysLogged "8"
HSET session:abc123:metrics daysMissed "2"
HSET session:abc123:metrics completionRate "80"
HSET session:abc123:metrics calculatedAt "1710518400000"
```

**Calculation Logic**:

**Current Day** (FR-011):
```typescript
function calculateCurrentDay(challenge: Challenge): number {
  const start = new Date(challenge.startDate)
  const today = new Date(getTodayLocalDate())
  const diffTime = today.getTime() - start.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return Math.min(diffDays + 1, challenge.duration)
}
```

**Streak** (FR-020):
```typescript
function calculateStreak(logs: DailyLog[]): number {
  if (logs.length === 0) return 0

  // Sort by date descending
  const sorted = logs.sort((a, b) => b.date.localeCompare(a.date))

  let streak = 0
  let expectedDate = getTodayLocalDate()

  for (const log of sorted) {
    // Break streak if: not expected date OR zero pushups
    if (log.date !== expectedDate || log.pushups === 0) break

    streak++
    // Move to previous day
    const date = new Date(expectedDate)
    date.setDate(date.getDate() - 1)
    expectedDate = formatLocalDate(date)
  }

  return streak
}
```

**Completion Rate** (FR-024):
```typescript
function calculateCompletionRate(daysLogged: number, currentDay: number): number {
  if (currentDay === 0) return 0
  return Math.round((daysLogged / currentDay) * 100)
}
```

**Access Patterns**:
- Calculate and cache after each log submission
- Read on dashboard/metrics display (FR-019)
- Invalidate and recalculate when:
  - New log added
  - Challenge status changes
  - User navigates to dashboard (if cache is stale)

---

## Data Relationships

```
Session (1) ──── (0..1) Challenge ──── (0..365) DailyLog
   │                                        │
   └────────────────────────────────────────┴─── (0..1) ProgressMetrics
```

**Cardinality Rules**:
- One session can have zero or one active challenge (FR-013)
- One challenge can have zero to 365 daily logs (max duration)
- One session has zero or one metrics cache
- Metrics are derived from challenge + logs

---

## Data Lifecycle

### Challenge Creation Flow

```typescript
// 1. Check no active challenge exists
const existingChallenge = await redis.hgetall(`session:${sessionId}:challenge`)
if (existingChallenge && existingChallenge.status === 'active') {
  throw new Error('Active challenge already exists') // FR-013
}

// 2. Delete previous challenge data
await redis.del(`session:${sessionId}:challenge`)
await redis.del(`session:${sessionId}:logs`)
await redis.del(`session:${sessionId}:metrics`)

// 3. Create new challenge
const challenge: Challenge = {
  id: crypto.randomUUID(),
  sessionId,
  duration,
  startDate: getTodayLocalDate(),
  status: 'active',
  createdAt: Date.now(),
}

await redis.hset(`session:${sessionId}:challenge`, challenge)

// 4. Update session activity
await redis.hset(`session:${sessionId}`, 'lastActivity', Date.now())
await refreshSessionTTL(sessionId)
```

### Daily Log Submission Flow

```typescript
// 1. Validate session exists
const session = await redis.hgetall(`session:${sessionId}`)
if (!session) throw new Error('Session not found')

// 2. Validate active challenge exists
const challenge = await redis.hgetall(`session:${sessionId}:challenge`)
if (!challenge || challenge.status !== 'active') {
  throw new Error('No active challenge')
}

// 3. Check if already logged today (FR-005)
const today = getTodayLocalDate()
const allLogs = await redis.zrange(`session:${sessionId}:logs`, 0, -1)
const parsedLogs = allLogs.map(log => JSON.parse(log))
const hasLoggedToday = parsedLogs.some(log => log.date === today)

if (hasLoggedToday) {
  throw new Error('Already logged today') // FR-005
}

// 4. Validate not retroactive (FR-006)
// This is implicitly enforced by only allowing today's date

// 5. Create log entry
const log: DailyLog = {
  date: today,
  pushups,
  timestamp: Date.now(),
  timezone: getUserTimezone(),
}

// 6. Insert into sorted set
const dateTimestamp = new Date(today).getTime()
await redis.zadd(`session:${sessionId}:logs`, {
  score: dateTimestamp,
  member: JSON.stringify(log),
})

// 7. Recalculate metrics
await calculateAndCacheMetrics(sessionId)

// 8. Update session activity
await redis.hset(`session:${sessionId}`, 'lastActivity', Date.now())
await refreshSessionTTL(sessionId)

// 9. Check if challenge complete
const metrics = await redis.hgetall(`session:${sessionId}:metrics`)
if (metrics.currentDay >= challenge.duration) {
  await redis.hset(`session:${sessionId}:challenge`, 'status', 'completed')
  await redis.hset(`session:${sessionId}:challenge`, 'completedAt', Date.now())
}
```

### Challenge Completion Flow

```typescript
// 1. Get challenge and metrics
const challenge = await redis.hgetall(`session:${sessionId}:challenge`)
const metrics = await redis.hgetall(`session:${sessionId}:metrics`)

// 2. Prepare completion summary (FR-015)
const summary = {
  totalPushups: metrics.totalPushups,
  completionRate: metrics.completionRate,
  bestDay: metrics.personalBest,
  finalStreak: metrics.streak,
}

// 3. Update challenge status
await redis.hset(`session:${sessionId}:challenge`, 'status', 'completed')
await redis.hset(`session:${sessionId}:challenge`, 'completedAt', Date.now())

// 4. Return summary for display
return summary
```

---

## Data Access Layer API

```typescript
// lib/challenge/repository.ts

export interface ChallengeRepository {
  // Session operations
  createSession(timezone: string): Promise<Session>
  getSession(sessionId: string): Promise<Session | null>
  updateSessionActivity(sessionId: string): Promise<void>

  // Challenge operations
  createChallenge(sessionId: string, duration: number): Promise<Challenge>
  getActiveChallenge(sessionId: string): Promise<Challenge | null>
  abandonChallenge(sessionId: string): Promise<void>
  completeChallenge(sessionId: string): Promise<void>

  // Log operations
  logPushups(sessionId: string, pushups: number): Promise<DailyLog>
  canLogToday(sessionId: string): Promise<boolean>
  getAllLogs(sessionId: string): Promise<DailyLog[]>
  getYesterdayLog(sessionId: string): Promise<DailyLog | null>

  // Metrics operations
  getMetrics(sessionId: string): Promise<ProgressMetrics>
  calculateMetrics(sessionId: string): Promise<ProgressMetrics>
}
```

---

## Data Validation

All validation is performed using Zod schemas:

```typescript
// lib/challenge/validation.ts
import { z } from 'zod'

export const ChallengeSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  duration: z.number().int().min(1).max(365),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['active', 'completed', 'abandoned']),
  createdAt: z.number().int().positive(),
  completedAt: z.number().int().positive().optional(),
})

export const DailyLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pushups: z.number().int().min(0).max(10000),
  timestamp: z.number().int().positive(),
  timezone: z.string().min(1),
})

export const SessionSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.number().int().positive(),
  lastActivity: z.number().int().positive(),
  timezone: z.string().min(1),
})
```

---

## Performance Considerations

1. **Sorted Sets for Logs**: O(log N) insertion, O(1) range queries
2. **Metrics Caching**: Avoid recalculating on every read
3. **TTL Management**: Automatic cleanup prevents storage bloat
4. **Pipelining**: Batch Redis commands when possible:
   ```typescript
   const pipeline = redis.pipeline()
   pipeline.hset(`session:${sessionId}`, 'lastActivity', Date.now())
   pipeline.zadd(`session:${sessionId}:logs`, { score, member })
   pipeline.hset(`session:${sessionId}:metrics`, metrics)
   await pipeline.exec()
   ```

---

## Migration Strategy

Since this is the first version and Redis is ephemeral (session-based), no migration is needed. Future schema changes:

1. **Add new optional field**: Backwards compatible, old sessions work
2. **Remove field**: Backwards compatible, ignored if missing
3. **Rename field**: Breaking change, requires version flag:
   ```typescript
   const schemaVersion = await redis.hget(`session:${sessionId}`, 'schemaVersion')
   if (schemaVersion === '1') {
     // Old schema handling
   } else {
     // New schema handling
   }
   ```
4. **Change data structure**: Create new keys, deprecate old ones over TTL period

---

## Next Steps

Data model is complete. Ready for:
1. API contract definition
2. Implementation of repository layer
3. Unit tests for calculation logic
