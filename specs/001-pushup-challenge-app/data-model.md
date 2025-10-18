# Data Model: Pushup Challenge Tracker

**Date**: 2025-10-18
**Storage**: Redis (standard redis package)
**Authentication**: URL-based via challenge ID

---

## Overview

The data model uses Redis key-value store with challenge ID-based isolation. Each challenge has a cryptographically random UUID that serves as both the primary key and authentication token. The challenge ID is embedded in URLs (e.g., `/challenge/{id}`), making challenges shareable and bookmarkable. Data is organized using Redis data structures optimized for our access patterns.

---

## Redis Key Structure

```
challenge:{challengeId}                 → Hash: Challenge metadata
challenge:{challengeId}:logs            → Sorted Set: Daily logs (sorted by date)
challenge:{challengeId}:metrics         → Hash: Cached metrics
```

---

## Entity Definitions

### 1. Challenge

**Purpose**: Store challenge configuration and status

**Redis Structure**: Hash
**Key**: `challenge:{challengeId}`
**TTL**: Challenge duration + 30 days grace period

**Fields**:
```typescript
interface Challenge {
  id: string              // Challenge UUID (also used in URL)
  duration: number        // Challenge length in days (1-365)
  startDate: string       // YYYY-MM-DD in user's local timezone
  status: 'active' | 'completed' | 'abandoned'
  createdAt: number       // Unix timestamp (ms)
  completedAt?: number    // Unix timestamp (ms), null if not completed
  timezone: string        // IANA timezone at creation
}
```

**Redis Representation**:
```redis
HSET challenge:abc123 id "abc123"
HSET challenge:abc123 duration "30"
HSET challenge:abc123 startDate "2024-03-15"
HSET challenge:abc123 status "active"
HSET challenge:abc123 createdAt "1710518400000"
HSET challenge:abc123 timezone "America/New_York"
EXPIRE challenge:abc123 5184000  # (30 + 30) * 24 * 60 * 60 = 60 days for 30-day challenge
```

**Validation Rules**:
- `id`: UUID v4 format
- `duration`: Integer, 1-365 inclusive (FR-002)
- `startDate`: YYYY-MM-DD format, must be valid calendar date
- `status`: Must be one of: 'active', 'completed', 'abandoned'
- `createdAt`: Must be <= current time
- `completedAt`: If present, must be >= createdAt
- `timezone`: Must be valid IANA timezone

**State Transitions**:
```
active → completed  (when current day > startDate + duration)
active → abandoned  (when user explicitly abandons via FR-016)
```

**Access Patterns**:
- Create once, returns unique URL with challenge ID
- Read using challenge ID from URL parameter
- Update status when challenge completes or is abandoned
- Auto-delete via TTL after grace period expires

---

### 2. Daily Log Entry

**Purpose**: Track daily pushup counts

**Redis Structure**: Sorted Set
**Key**: `challenge:{challengeId}:logs`
**Score**: Unix timestamp of the log date at midnight UTC (for sorting)
**Member**: JSON-encoded log entry
**TTL**: Matches parent challenge TTL (duration + 30 days)

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
ZADD challenge:abc123:logs 1710460800 '{"date":"2024-03-15","pushups":50,"timestamp":1710518400000,"timezone":"America/New_York"}'
ZADD challenge:abc123:logs 1710547200 '{"date":"2024-03-16","pushups":55,"timestamp":1710604800000,"timezone":"America/New_York"}'
EXPIRE challenge:abc123:logs 5184000  # Same TTL as parent challenge
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
const logs = await redis.zrange('challenge:abc123:logs', 0, -1)

// Get logs for last 7 days
const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
const recentLogs = await redis.zrangebyscore('challenge:abc123:logs', sevenDaysAgo, Date.now())

// Count total logs
const count = await redis.zcard('challenge:abc123:logs')

// Get yesterday's log (most recent before today)
const allLogs = await redis.zrange('challenge:abc123:logs', -2, -2)
```

---

### 3. Progress Metrics (Calculated)

**Purpose**: Cache calculated metrics for performance

**Redis Structure**: Hash
**Key**: `challenge:{challengeId}:metrics`
**TTL**: Matches parent challenge TTL, invalidated and recalculated on each log submission

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
HSET challenge:abc123:metrics currentDay "10"
HSET challenge:abc123:metrics streak "7"
HSET challenge:abc123:metrics personalBest "75"
HSET challenge:abc123:metrics totalPushups "525"
HSET challenge:abc123:metrics daysLogged "8"
HSET challenge:abc123:metrics daysMissed "2"
HSET challenge:abc123:metrics completionRate "80"
HSET challenge:abc123:metrics calculatedAt "1710518400000"
EXPIRE challenge:abc123:metrics 5184000  # Same TTL as parent challenge
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
Challenge (1) ──── (0..365) DailyLog
     │
     └──────────── (0..1) ProgressMetrics
```

**Cardinality Rules**:
- One challenge can have zero to 365 daily logs (max duration)
- One challenge has zero or one metrics cache
- Metrics are derived from challenge + logs
- Challenge ID serves as both primary key and authentication token

---

## Data Lifecycle

### Challenge Creation Flow

```typescript
// 1. Generate unique challenge ID
const challengeId = crypto.randomUUID()

// 2. Calculate TTL (duration + 30 day grace period)
const ttlSeconds = (duration + 30) * 24 * 60 * 60

// 3. Create challenge
const challenge: Challenge = {
  id: challengeId,
  duration,
  startDate: getTodayLocalDate(),
  status: 'active',
  createdAt: Date.now(),
  timezone: getUserTimezone(),
}

await redis.hset(`challenge:${challengeId}`, challenge)
await redis.expire(`challenge:${challengeId}`, ttlSeconds)

// 4. Return challenge ID for URL
return challengeId // Used in: /challenge/{challengeId}
```

### Daily Log Submission Flow

```typescript
// 1. Validate challenge exists and is active
const challenge = await redis.hgetall(`challenge:${challengeId}`)
if (!challenge) throw new Error('Challenge not found')
if (challenge.status !== 'active') {
  throw new Error('Challenge is not active')
}

// 2. Check if already logged today (FR-005)
const today = getTodayLocalDate()
const allLogs = await redis.zrange(`challenge:${challengeId}:logs`, 0, -1)
const parsedLogs = allLogs.map(log => JSON.parse(log))
const hasLoggedToday = parsedLogs.some(log => log.date === today)

if (hasLoggedToday) {
  throw new Error('Already logged today') // FR-005
}

// 3. Validate not retroactive (FR-006)
// This is implicitly enforced by only allowing today's date

// 4. Create log entry
const log: DailyLog = {
  date: today,
  pushups,
  timestamp: Date.now(),
  timezone: getUserTimezone(),
}

// 5. Insert into sorted set
const dateTimestamp = new Date(today).getTime()
const ttlSeconds = (challenge.duration + 30) * 24 * 60 * 60

await redis.zadd(`challenge:${challengeId}:logs`, {
  score: dateTimestamp,
  member: JSON.stringify(log),
})
await redis.expire(`challenge:${challengeId}:logs`, ttlSeconds)

// 6. Recalculate metrics
await calculateAndCacheMetrics(challengeId)

// 7. Check if challenge complete
const metrics = await redis.hgetall(`challenge:${challengeId}:metrics`)
if (metrics.currentDay >= challenge.duration) {
  await redis.hset(`challenge:${challengeId}`, 'status', 'completed')
  await redis.hset(`challenge:${challengeId}`, 'completedAt', Date.now())
}
```

### Challenge Completion Flow

```typescript
// 1. Get challenge and metrics
const challenge = await redis.hgetall(`challenge:${challengeId}`)
const metrics = await redis.hgetall(`challenge:${challengeId}:metrics`)

// 2. Prepare completion summary (FR-015)
const summary = {
  totalPushups: metrics.totalPushups,
  completionRate: metrics.completionRate,
  bestDay: metrics.personalBest,
  finalStreak: metrics.streak,
}

// 3. Update challenge status
await redis.hset(`challenge:${challengeId}`, 'status', 'completed')
await redis.hset(`challenge:${challengeId}`, 'completedAt', Date.now())

// 4. Return summary for display
return summary
```

---

## Data Access Layer API

```typescript
// lib/challenge/repository.ts

export interface ChallengeRepository {
  // Challenge operations
  createChallenge(duration: number, timezone: string): Promise<string> // Returns challengeId
  getChallenge(challengeId: string): Promise<Challenge | null>
  abandonChallenge(challengeId: string): Promise<void>
  completeChallenge(challengeId: string): Promise<void>

  // Log operations
  logPushups(challengeId: string, pushups: number): Promise<DailyLog>
  canLogToday(challengeId: string): Promise<boolean>
  getAllLogs(challengeId: string): Promise<DailyLog[]>
  getYesterdayLog(challengeId: string): Promise<DailyLog | null>

  // Metrics operations
  getMetrics(challengeId: string): Promise<ProgressMetrics>
  calculateMetrics(challengeId: string): Promise<ProgressMetrics>
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
  duration: z.number().int().min(1).max(365),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['active', 'completed', 'abandoned']),
  createdAt: z.number().int().positive(),
  completedAt: z.number().int().positive().optional(),
  timezone: z.string().min(1),
})

export const DailyLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pushups: z.number().int().min(0).max(10000),
  timestamp: z.number().int().positive(),
  timezone: z.string().min(1),
})

```

---

## Performance Considerations

1. **Sorted Sets for Logs**: O(log N) insertion, O(1) range queries
2. **Metrics Caching**: Avoid recalculating on every read
3. **TTL Management**: Automatic cleanup prevents storage bloat (duration + 30 days)
4. **Pipelining**: Batch Redis commands when possible:
   ```typescript
   const pipeline = redis.pipeline()
   pipeline.zadd(`challenge:${challengeId}:logs`, { score, member })
   pipeline.expire(`challenge:${challengeId}:logs`, ttlSeconds)
   pipeline.hset(`challenge:${challengeId}:metrics`, metrics)
   pipeline.expire(`challenge:${challengeId}:metrics`, ttlSeconds)
   await pipeline.exec()
   ```

---

## Migration Strategy

Since this is the first version and Redis keys are TTL-based (auto-expire), no migration is needed. Future schema changes:

1. **Add new optional field**: Backwards compatible, old challenges work
2. **Remove field**: Backwards compatible, ignored if missing
3. **Rename field**: Breaking change, requires version flag:
   ```typescript
   const schemaVersion = await redis.hget(`challenge:${challengeId}`, 'schemaVersion')
   if (schemaVersion === '1') {
     // Old schema handling
   } else {
     // New schema handling
   }
   ```
4. **Change data structure**: Create new key patterns, old ones expire naturally via TTL

---

## Next Steps

Data model is complete. Ready for:
1. API contract definition
2. Implementation of repository layer
3. Unit tests for calculation logic
