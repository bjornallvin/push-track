# Data Model: Multi-Activity Challenge Tracking

**Date**: 2025-10-18
**Storage**: Redis (standard redis package)
**Authentication**: URL-based via challenge ID
**Parent Feature**: 001-pushup-challenge-app

---

## Overview

This document describes the data model changes required to support multi-activity challenge tracking. The core storage mechanism remains Redis with challenge ID-based isolation, but the Challenge and DailyLog entities are updated to support multiple activities per challenge.

---

## Redis Key Structure

```
challenge:{challengeId}                      → Hash: Challenge metadata (including activities array)
challenge:{challengeId}:logs                 → Sorted Set: Daily logs (one entry per activity per day)
challenge:{challengeId}:metrics:{activity}   → Hash: Cached metrics per activity
```

### Changes from 001-pushup-challenge-app:
- **Challenge hash**: Added `activities` field (JSON array of activity names)
- **Logs sorted set**: Entries now include activity name in the stored data
- **Metrics hashes**: Changed from single `metrics` hash to one hash per activity

---

## Entity Definitions

### 1. Challenge (Updated)

**Purpose**: Store challenge configuration, status, and selected activities

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
  completedAt?: number    // Unix timestamp (ms), undefined if not completed
  timezone: string        // IANA timezone at creation
  email?: string          // Optional email for sending challenge link
  activities: string[]    // Array of 1-5 activity names (e.g., ["Push-ups", "Pull-ups"])
}
```

**Changes**:
- **Added**: `activities` field (array of strings, 1-5 items)

**Redis Representation**:
```redis
HSET challenge:abc123 id "abc123"
HSET challenge:abc123 duration "30"
HSET challenge:abc123 startDate "2025-10-18"
HSET challenge:abc123 status "active"
HSET challenge:abc123 createdAt "1729267200000"
HSET challenge:abc123 timezone "America/New_York"
HSET challenge:abc123 activities '["Push-ups","Pull-ups","Abs"]'
```

**Validation**:
- `activities` must be a non-empty array
- `activities` must contain 1-5 items
- Each activity name must be 1-30 characters
- Each activity name must match pattern: `^[a-zA-Z0-9\s\-]+$`

---

### 2. Daily Log Entry (Updated)

**Purpose**: Store reps for one activity on one specific date

**Redis Structure**: Sorted Set member value (JSON string)
**Key**: `challenge:{challengeId}:logs`
**Score**: Unix timestamp of date (for chronological sorting)

**Fields**:
```typescript
interface DailyLog {
  date: string      // YYYY-MM-DD in user's local timezone
  activity: string  // Activity name (e.g., "Push-ups", "Pull-ups")
  reps: number      // Rep count (0-10,000)
  timestamp: number // Unix timestamp (ms) when logged
  timezone: string  // User's timezone at time of logging
}
```

**Changes**:
- **Added**: `activity` field (string, activity name)
- **Renamed**: `pushups` → `reps` (more generic)

**Redis Representation**:
```redis
# Each day with N activities will have N entries in the sorted set
ZADD challenge:abc123:logs 1729267200000 '{"date":"2025-10-18","activity":"Push-ups","reps":25,"timestamp":1729267245000,"timezone":"America/New_York"}'
ZADD challenge:abc123:logs 1729267200000 '{"date":"2025-10-18","activity":"Pull-ups","reps":10,"timestamp":1729267250000,"timezone":"America/New_York"}'
ZADD challenge:abc123:logs 1729267200000 '{"date":"2025-10-18","activity":"Abs","reps":30,"timestamp":1729267255000,"timezone":"America/New_York"}'
```

**Notes**:
- Multiple entries can share the same score (date timestamp) since different activities can be logged on the same day
- Uniqueness is enforced by the combination of `(date, activity)` in application logic
- Score is based on date only (not timestamp) to enable range queries by date

---

### 3. Activity Metrics (New Per-Activity Structure)

**Purpose**: Cache calculated metrics for each activity independently

**Redis Structure**: Hash per activity
**Key**: `challenge:{challengeId}:metrics:{activity}`
**TTL**: Challenge duration + 30 days grace period

**Fields**:
```typescript
interface ActivityMetrics {
  activity: string        // Activity name
  currentDay: number      // Day number in challenge (e.g., 5 for "Day 5 of 30")
  streak: number          // Consecutive days with non-zero reps for this activity
  personalBest: number    // Highest single-day rep count for this activity
  totalReps: number       // Sum of all logged reps for this activity
  daysLogged: number      // Count of days with any log entry for this activity
  daysMissed: number      // Count of days without log entry for this activity
  completionRate: number  // Percentage: (daysLogged / currentDay) * 100
  calculatedAt: number    // Unix timestamp (ms) when metrics were calculated
}
```

**Changes**:
- **New**: Metrics are now calculated and stored separately for each activity
- **Added**: `activity` field to identify which activity the metrics belong to
- **Same logic**: `streak`, `personalBest`, `totalReps`, etc. calculated per activity

**Redis Representation**:
```redis
# Separate metrics hash for each activity
HSET challenge:abc123:metrics:Push-ups activity "Push-ups"
HSET challenge:abc123:metrics:Push-ups currentDay "5"
HSET challenge:abc123:metrics:Push-ups streak "5"
HSET challenge:abc123:metrics:Push-ups personalBest "30"
HSET challenge:abc123:metrics:Push-ups totalReps "125"
HSET challenge:abc123:metrics:Push-ups calculatedAt "1729267300000"

HSET challenge:abc123:metrics:Pull-ups activity "Pull-ups"
HSET challenge:abc123:metrics:Pull-ups currentDay "5"
HSET challenge:abc123:metrics:Pull-ups streak "3"
HSET challenge:abc123:metrics:Pull-ups personalBest "12"
HSET challenge:abc123:metrics:Pull-ups totalReps "48"
HSET challenge:abc123:metrics:Pull-ups calculatedAt "1729267300000"
```

**Notes**:
- Each activity has its own independent metrics hash
- Streaks can differ between activities (one activity can have a longer streak than another)
- Personal bests are per activity (not global across all activities)

---

## Migration Strategy

### Existing Challenges (001 Feature)

Challenges created before the multi-activity feature need to be migrated automatically:

**Migration Logic**:
```typescript
// For each existing challenge without 'activities' field:
if (!challenge.activities) {
  challenge.activities = ["Push-ups"]  // Default to single "Push-ups" activity
}

// For each existing log without 'activity' field:
if (!log.activity) {
  log.activity = "Push-ups"  // Associate with "Push-ups" activity
  log.reps = log.pushups      // Copy pushups value to reps
  delete log.pushups          // Remove old field
}

// Metrics migration:
// Old key: challenge:{id}:metrics
// New key: challenge:{id}:metrics:Push-ups
```

**Backward Compatibility**:
- Old challenges will seamlessly work as single-activity "Push-ups" challenges
- No data loss occurs during migration
- Migration happens lazily when challenges are loaded

---

## Data Access Patterns

### Creating a Challenge with Activities
```typescript
// User selects: ["Push-ups", "Pull-ups", "Abs"]
const challenge = {
  id: randomUUID(),
  duration: 30,
  startDate: "2025-10-18",
  status: "active",
  createdAt: Date.now(),
  timezone: "America/New_York",
  activities: ["Push-ups", "Pull-ups", "Abs"]
}

await redis.hSet(`challenge:${challengeId}`, {
  ...challenge,
  activities: JSON.stringify(challenge.activities)
})
```

### Logging Multiple Activities for a Day
```typescript
// User logs: Push-ups: 25, Pull-ups: 10, Abs: 30
const date = "2025-10-18"
const dateTimestamp = new Date(date).getTime()

for (const [activity, reps] of Object.entries(todayLogs)) {
  const log = {
    date,
    activity,
    reps,
    timestamp: Date.now(),
    timezone: "America/New_York"
  }

  await redis.zAdd(`challenge:${challengeId}:logs`, {
    score: dateTimestamp,
    value: JSON.stringify(log)
  })
}
```

### Retrieving Logs for a Specific Activity
```typescript
// Get all logs and filter by activity
const allLogs = await redis.zRange(`challenge:${challengeId}:logs`, 0, -1)
const pushupLogs = allLogs
  .map(item => JSON.parse(item))
  .filter(log => log.activity === "Push-ups")
```

### Calculating Metrics Per Activity
```typescript
const challenge = await getChallenge(challengeId)
const allLogs = await getAllLogs(challengeId)

for (const activity of challenge.activities) {
  const activityLogs = allLogs.filter(log => log.activity === activity)
  const metrics = calculateMetrics(challenge, activityLogs, activity)

  await redis.hSet(`challenge:${challengeId}:metrics:${activity}`, metrics)
}
```

---

## Validation Rules

### Activity Names
- **Length**: 1-30 characters
- **Pattern**: `^[a-zA-Z0-9\s\-]+$` (alphanumeric, spaces, hyphens)
- **Uniqueness**: Case-insensitive unique within a challenge (no duplicates)
- **Reserved**: None (users can override preset names with custom ones)

### Activities Array
- **Min**: 1 activity
- **Max**: 5 activities
- **Immutable**: Cannot be changed after challenge creation

### Reps Value
- **Min**: 0
- **Max**: 10,000
- **Type**: Integer

---

## Storage Size Estimates

### Single-Activity Challenge (30 days, 1 activity)
- Challenge hash: ~200 bytes
- Logs (30 entries): ~3 KB
- Metrics (1 activity): ~200 bytes
- **Total**: ~3.4 KB

### Multi-Activity Challenge (30 days, 5 activities)
- Challenge hash: ~250 bytes
- Logs (150 entries = 30 days × 5 activities): ~15 KB
- Metrics (5 activities): ~1 KB
- **Total**: ~16.25 KB

**Growth Factor**: ~4.8x for 5-activity vs 1-activity challenge

---

## Indexes and Queries

No additional indexes required beyond existing sorted set for logs.

**Common Queries**:
1. Get all logs for a challenge: `ZRANGE challenge:{id}:logs 0 -1`
2. Get logs for a specific activity: Application-level filter after ZRANGE
3. Get metrics for an activity: `HGETALL challenge:{id}:metrics:{activity}`
4. Check if logged today for activity: Application-level filter on today's logs

**Performance Considerations**:
- Sorted set enables efficient chronological retrieval
- Filtering by activity happens in application layer (acceptable for 30-365 day challenges with 1-5 activities)
- Metrics caching per activity prevents repeated calculations
- TTL ensures automatic cleanup of completed challenges

---

## Summary of Changes

| Aspect | 001 (Single Activity) | 002 (Multi Activity) |
|--------|----------------------|----------------------|
| **Challenge.activities** | Not present | Array of 1-5 activity names |
| **DailyLog.activity** | Not present | Activity name string |
| **DailyLog field name** | `pushups` | `reps` |
| **Metrics storage** | Single hash | One hash per activity |
| **Logs per day** | 1 entry | 1-5 entries (one per activity) |
| **Streak calculation** | Global | Per activity |
| **Charts** | Single chart | One chart per activity |
