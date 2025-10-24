# Data Model: Late Entry Editing

**Feature**: Late Entry Editing
**Branch**: 003-late-entry-editing
**Date**: 2025-10-24

## Overview

This document defines the data model for late entry editing functionality. The feature extends existing data structures with minimal changes, maintaining backward compatibility.

---

## Entities

### Daily Log Entry (Existing - No Changes)

Represents a single activity logged for a specific date.

**TypeScript Definition** (`lib/challenge/types.ts`):
```typescript
export interface DailyLog {
  date: string;          // ISO date format (YYYY-MM-DD)
  activity: string;      // Activity name (e.g., "Push-ups", "Running")
  reps: number;          // Activity count (can be 0 for missed days)
}
```

**Redis Storage**:
```
Key: challenge:{challengeId}:logs
Type: Sorted Set (ZADD)
Member: JSON.stringify(DailyLog)
Score: Unix timestamp of date (for chronological ordering)
```

**Validation Rules**:
- `date`: Valid ISO date string, <= today, >= challenge start date
- `activity`: Must match one of the challenge's activities
- `reps`: Non-negative integer (0 to 10,000)

**Indexes**: None (sorted by timestamp score)

**Relationships**:
- Belongs to one Challenge (via `challengeId` in Redis key)
- References one Activity name from Challenge.activities array

---

### Challenge Day (Derived - No Storage)

Represents metadata about a specific day in the challenge period.

**TypeScript Definition** (new, for edit button logic):
```typescript
export interface ChallengeDay {
  date: string;               // ISO date (YYYY-MM-DD)
  dayNumber: number;          // 1-indexed day (1 = first day)
  isPast: boolean;            // date < today
  isCurrent: boolean;         // date === today
  isFuture: boolean;          // date > today
  isEditable: boolean;        // isPast || isCurrent (no future editing)
  logs: DailyLog[];           // Logs for this date (can be empty array)
}
```

**Derivation Logic**:
```typescript
function generateChallengeDay(date: Date, challenge: Challenge, allLogs: DailyLog[]): ChallengeDay {
  const today = startOfDay(new Date())
  const targetDate = startOfDay(date)
  const dayNumber = differenceInDays(targetDate, startOfDay(challenge.startDate)) + 1

  return {
    date: format(targetDate, 'yyyy-MM-dd'),
    dayNumber,
    isPast: targetDate < today,
    isCurrent: targetDate.getTime() === today.getTime(),
    isFuture: targetDate > today,
    isEditable: targetDate <= today && targetDate >= startOfDay(challenge.startDate),
    logs: allLogs.filter(log => log.date === format(targetDate, 'yyyy-MM-dd'))
  }
}
```

**No Storage**: This is a view model computed on-demand from Challenge and DailyLog data.

---

### Activity (Existing - No Changes)

Represents a tracked activity type within a challenge.

**TypeScript Definition** (`lib/challenge/types.ts`):
```typescript
export type ActivityUnit =
  | 'reps'
  | 'minutes'
  | 'seconds'
  | 'km'
  | 'miles'
  | 'meters'
  | 'hours';

// Embedded in Challenge entity
interface Challenge {
  activities: string[];                          // 1-5 activity names
  activityUnits: Record<string, ActivityUnit>;   // Map activity → unit
  // ... other fields
}
```

**Storage**: Embedded in Challenge hash (no separate storage).

**Validation Rules**:
- 1 to 5 activities per challenge
- Each activity must have a corresponding unit in activityUnits

---

## Request/Response Types

### Log/Edit Request (Extended)

**TypeScript Definition** (modified in `lib/challenge/types.ts`):
```typescript
export interface LogEntry {
  activity: string;
  reps: number;
}

export interface LogRepsRequest {
  logs: LogEntry[];
  date?: string;  // NEW: Optional ISO date (defaults to today if omitted)
}
```

**Zod Schema** (modified in `lib/challenge/validation.ts`):
```typescript
import { z } from 'zod'

const LogEntrySchema = z.object({
  activity: z.string().min(1).max(50),
  reps: z.number().int().nonnegative().max(10000)
})

const LogRepsRequestSchema = z.object({
  logs: z.array(LogEntrySchema).min(1).max(5),
  date: z.string().datetime().optional()  // NEW: Optional ISO date
}).refine(
  (data) => {
    if (!data.date) return true  // Skip validation if not provided

    const targetDate = new Date(data.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return targetDate <= today  // Must not be future date
  },
  { message: 'Cannot edit future dates' }
)
```

**Example Payloads**:
```json
// Current-day logging (existing behavior)
{
  "logs": [
    { "activity": "Push-ups", "reps": 50 },
    { "activity": "Sit-ups", "reps": 30 }
  ]
}

// Late entry editing (new behavior)
{
  "logs": [
    { "activity": "Push-ups", "reps": 42 }
  ],
  "date": "2025-10-20"
}
```

---

### Log Response (Existing - No Changes)

**TypeScript Definition**:
```typescript
export interface ActivityMetrics {
  streak: number;
  personalBest: number;
  totalReps: number;
  currentDay: number;
}

export interface LogRepsResponse {
  logs: DailyLog[];
  activityMetrics: Record<string, ActivityMetrics>;
  challengeCompleted: boolean;
}
```

**No changes needed**: Existing response structure supports late entry edits.

---

## State Transitions

### Daily Log Lifecycle

```
[No Log]
    ↓ (User logs current day OR edits past day)
[Logged (reps > 0)]
    ↓ (User edits to change value)
[Logged (updated reps)]
    ↓ (User edits to 0)
[Missed (reps = 0)] ← Red bar in chart
    ↓ (User edits to add value)
[Logged (reps > 0)] ← Activity-colored bar
```

**State Rules**:
- A date can have at most one log entry per activity
- Editing a date creates a new log if none exists, or updates existing log
- Setting reps to 0 is valid (represents missed day)
- Logs cannot be deleted (only set to 0)

---

### Challenge Day Editability States

```
[Future Day]
   isEditable = false → Edit button disabled/hidden

[Current Day]
   isEditable = true → Edit button enabled (same as existing "Log Today")

[Past Day]
   isEditable = true → Edit button enabled (NEW functionality)

[Completed Challenge + Past Day]
   isEditable = true → Allows historical corrections (per edge case spec)
```

---

## Validation Rules

### Date Validation

| Rule | Check | Error Message |
|------|-------|---------------|
| Format | ISO 8601 (YYYY-MM-DD) | "Invalid date format" |
| Not future | date <= today | "Cannot edit future dates" |
| Within challenge | date >= challenge.startDate | "Date before challenge start" |
| Within challenge | date < challenge.startDate + duration | "Date after challenge end" |

### Activity Validation (Existing)

| Rule | Check | Error Message |
|------|-------|---------------|
| All activities present | logs.length === challenge.activities.length | "Missing activities" |
| No extra activities | logs.every(l => challenge.activities.includes(l.activity)) | "Invalid activities" |
| Non-negative reps | reps >= 0 | "Reps must be non-negative" |
| Max reps | reps <= 10,000 | "Reps exceed maximum" |

---

## Relationships

```
Challenge (1) ──── (0..*) DailyLog
   │                       │
   │                       └─ date: string (ISO)
   │                       └─ activity: string (references Challenge.activities)
   │                       └─ reps: number
   │
   └─ activities: string[] (1..5)
   └─ activityUnits: Record<string, ActivityUnit>
   └─ startDate: string
   └─ duration: number
```

**Cardinality**:
- One Challenge has 0 to (duration × activities.length) DailyLog entries
- Each DailyLog belongs to exactly one Challenge (via Redis key pattern)
- Each DailyLog references exactly one Activity name from Challenge.activities

**Referential Integrity**:
- Activity names in DailyLog.activity MUST exist in Challenge.activities (enforced in API validation)
- Date in DailyLog.date MUST be within [Challenge.startDate, Challenge.startDate + duration) (enforced in API validation)

---

## Data Migration

**Required Changes**: None

**Backward Compatibility**:
- Existing logs work unchanged
- New `date` parameter in LogRepsRequest is optional (defaults to today)
- Old clients without date parameter continue working as before

**Migration Script**: Not needed (data structure unchanged)

---

## Performance Considerations

### Redis Operations Per Edit

| Operation | Redis Command | Estimated Latency |
|-----------|---------------|-------------------|
| Fetch challenge | HGETALL challenge:{id} | ~1ms |
| Fetch existing log | ZRANGEBYSCORE challenge:{id}:logs | ~1-2ms |
| Update/insert log | ZADD challenge:{id}:logs | ~1ms |
| Recalc metrics | HSET challenge:{id}:metrics:{activity} | ~1ms per activity |

**Total latency**: ~5-10ms (well within 500ms target)

### Chart Re-rendering

- No change from existing behavior
- Full log set fetched on page load
- Chart.js rendering: <1s for 365 days (existing performance)

---

## Example Data Flows

### Flow 1: Edit Missed Day (Add Data)

**Initial State**:
```json
// Redis: challenge:abc123:logs
// (date 2025-10-20 has no entry)

// Logs for 2025-10-19:
{ "date": "2025-10-19", "activity": "Push-ups", "reps": 50 }

// Logs for 2025-10-21:
{ "date": "2025-10-21", "activity": "Push-ups", "reps": 45 }
```

**User Action**: Click edit button on Oct 20, enter 42 reps

**API Request**:
```json
POST /api/challenge/abc123/log
{
  "logs": [{ "activity": "Push-ups", "reps": 42 }],
  "date": "2025-10-20"
}
```

**Redis Operations**:
1. Check if log exists for 2025-10-20 + Push-ups → None found
2. ZADD challenge:abc123:logs (timestamp of Oct 20) '{"date":"2025-10-20","activity":"Push-ups","reps":42}'
3. Recalculate metrics for Push-ups

**Final State**:
```json
// Redis: challenge:abc123:logs now includes:
{ "date": "2025-10-20", "activity": "Push-ups", "reps": 42 }

// Chart: Red bar on Oct 20 changes to purple bar (height 42)
```

---

### Flow 2: Edit Existing Day (Update Data)

**Initial State**:
```json
// Redis: challenge:abc123:logs
{ "date": "2025-10-22", "activity": "Push-ups", "reps": 50 }
{ "date": "2025-10-22", "activity": "Sit-ups", "reps": 30 }
```

**User Action**: Click edit button on Oct 22, change Push-ups to 60

**API Request**:
```json
POST /api/challenge/abc123/log
{
  "logs": [{ "activity": "Push-ups", "reps": 60 }],
  "date": "2025-10-22"
}
```

**Redis Operations**:
1. Check if log exists for 2025-10-22 + Push-ups → Found (reps: 50)
2. ZREM old entry
3. ZADD new entry with updated reps (60)
4. Recalculate metrics for Push-ups (Sit-ups metrics unchanged)

**Final State**:
```json
{ "date": "2025-10-22", "activity": "Push-ups", "reps": 60 }  // Updated
{ "date": "2025-10-22", "activity": "Sit-ups", "reps": 30 }   // Unchanged
```

---

## Summary

**Data Model Impact**: Minimal
- No new entities
- One new optional field (`date` in LogRepsRequest)
- One new derived view model (ChallengeDay for UI logic)
- All existing entities unchanged

**Storage Impact**: Zero
- Redis schema unchanged
- Same sorted set structure for logs
- No additional indexes needed

**Validation Impact**: Low
- Extend existing Zod schema with date validation
- Add date range checks (3 new rules)
- Reuse all activity validation logic

**Migration Impact**: Zero (backward compatible)
