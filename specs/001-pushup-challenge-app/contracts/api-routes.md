# API Contracts: Pushup Challenge Tracker

**Date**: 2025-10-18
**API Style**: REST (Next.js App Router Route Handlers)
**Base URL**: `/api`
**Authentication**: Session cookie (HttpOnly, Secure)

---

## Overview

All API routes use Next.js App Router route handlers (`app/api/*/route.ts`). Session management is handled via HttpOnly cookies set by the backend. Clients include the session cookie automatically on every request.

---

## Common Patterns

### Request Headers

```http
Cookie: session_id=abc-123-def-456
Content-Type: application/json
```

### Response Headers

```http
Content-Type: application/json
Set-Cookie: session_id=abc-123-def-456; HttpOnly; Secure; SameSite=Strict; Max-Age=31536000; Path=/
```

### Error Response Format

All errors follow this structure:

```typescript
interface ErrorResponse {
  error: string          // Machine-readable error code
  message: string        // Human-readable error message
  details?: unknown      // Optional additional context
  timestamp: number      // Unix timestamp (ms)
}
```

**Example**:
```json
{
  "error": "ALREADY_LOGGED_TODAY",
  "message": "You have already logged pushups for today",
  "timestamp": 1710518400000
}
```

### Success Response Format

```typescript
interface SuccessResponse<T> {
  success: true
  data: T
  timestamp: number
}
```

---

## Endpoints

### 1. Create Challenge

**Purpose**: Create a new pushup challenge (P1 user story)

**Route**: `POST /api/challenge`

**Request Body**:
```typescript
interface CreateChallengeRequest {
  duration: number  // 1-365 days
}
```

**Example**:
```json
{
  "duration": 30
}
```

**Validation** (Zod schema):
```typescript
const CreateChallengeSchema = z.object({
  duration: z.number().int().min(1).max(365),
})
```

**Success Response** (201 Created):
```typescript
interface CreateChallengeResponse {
  success: true
  data: {
    id: string              // Challenge UUID
    duration: number        // Challenge duration in days
    startDate: string       // YYYY-MM-DD
    status: 'active'
    currentDay: 1
  }
  timestamp: number
}
```

**Example**:
```json
{
  "success": true,
  "data": {
    "id": "ch_abc123",
    "duration": 30,
    "startDate": "2024-03-15",
    "status": "active",
    "currentDay": 1
  },
  "timestamp": 1710518400000
}
```

**Error Responses**:

| Status | Error Code | Scenario |
|--------|------------|----------|
| 400 | INVALID_DURATION | Duration not in range 1-365 |
| 409 | ACTIVE_CHALLENGE_EXISTS | Session already has active challenge (FR-013) |
| 500 | INTERNAL_ERROR | Redis error or unexpected failure |

**Example Error**:
```json
{
  "error": "ACTIVE_CHALLENGE_EXISTS",
  "message": "You already have an active challenge. Please complete or abandon it first.",
  "timestamp": 1710518400000
}
```

**Side Effects**:
- Creates challenge in Redis
- Deletes previous challenge data (if any)
- Sets/updates session cookie
- Updates session activity timestamp

---

### 2. Get Active Challenge

**Purpose**: Retrieve the current active challenge for dashboard display

**Route**: `GET /api/challenge`

**Request**: No body

**Success Response** (200 OK):
```typescript
interface GetChallengeResponse {
  success: true
  data: {
    id: string
    duration: number
    startDate: string       // YYYY-MM-DD
    status: 'active' | 'completed'
    currentDay: number      // Calculated from startDate
    metrics: {
      streak: number
      personalBest: number
      totalPushups: number
      daysLogged: number
      completionRate: number
    }
    hasLoggedToday: boolean
    yesterdayCount: number | null  // For pre-filling stepper (FR-022)
  }
  timestamp: number
}
```

**Example**:
```json
{
  "success": true,
  "data": {
    "id": "ch_abc123",
    "duration": 30,
    "startDate": "2024-03-15",
    "status": "active",
    "currentDay": 10,
    "metrics": {
      "streak": 7,
      "personalBest": 75,
      "totalPushups": 525,
      "daysLogged": 8,
      "completionRate": 80
    },
    "hasLoggedToday": false,
    "yesterdayCount": 50
  },
  "timestamp": 1710518400000
}
```

**Error Responses**:

| Status | Error Code | Scenario |
|--------|------------|----------|
| 404 | NO_ACTIVE_CHALLENGE | Session has no active challenge |
| 500 | INTERNAL_ERROR | Redis error |

---

### 3. Abandon Challenge

**Purpose**: Delete current challenge to start a new one (FR-016)

**Route**: `DELETE /api/challenge`

**Request**: No body

**Success Response** (200 OK):
```typescript
interface AbandonChallengeResponse {
  success: true
  data: {
    message: string
  }
  timestamp: number
}
```

**Example**:
```json
{
  "success": true,
  "data": {
    "message": "Challenge abandoned successfully"
  },
  "timestamp": 1710518400000
}
```

**Error Responses**:

| Status | Error Code | Scenario |
|--------|------------|----------|
| 404 | NO_ACTIVE_CHALLENGE | No challenge to abandon |
| 500 | INTERNAL_ERROR | Redis error |

**Side Effects**:
- Deletes challenge, logs, and metrics from Redis
- Updates session activity timestamp

---

### 4. Log Daily Pushups

**Purpose**: Record pushup count for today (P2 user story)

**Route**: `POST /api/challenge/log`

**Request Body**:
```typescript
interface LogPushupsRequest {
  pushups: number  // 0-10,000
}
```

**Example**:
```json
{
  "pushups": 50
}
```

**Validation** (Zod schema):
```typescript
const LogPushupsSchema = z.object({
  pushups: z.number().int().min(0).max(10000),
})
```

**Success Response** (201 Created):
```typescript
interface LogPushupsResponse {
  success: true
  data: {
    date: string            // YYYY-MM-DD
    pushups: number
    metrics: {
      streak: number        // Updated streak
      personalBest: number  // Updated if new record
      currentDay: number
    }
    challengeCompleted: boolean  // True if this was the last day
  }
  timestamp: number
}
```

**Example**:
```json
{
  "success": true,
  "data": {
    "date": "2024-03-15",
    "pushups": 50,
    "metrics": {
      "streak": 8,
      "personalBest": 75,
      "currentDay": 10
    },
    "challengeCompleted": false
  },
  "timestamp": 1710518400000
}
```

**Error Responses**:

| Status | Error Code | Scenario |
|--------|------------|----------|
| 400 | INVALID_PUSHUP_COUNT | Pushups not in range 0-10,000 (FR-007) |
| 404 | NO_ACTIVE_CHALLENGE | Session has no active challenge |
| 409 | ALREADY_LOGGED_TODAY | User already logged for today (FR-005) |
| 403 | CHALLENGE_COMPLETED | Challenge already completed |
| 500 | INTERNAL_ERROR | Redis error |

**Example Error**:
```json
{
  "error": "ALREADY_LOGGED_TODAY",
  "message": "You have already logged pushups for today. Try again tomorrow!",
  "details": {
    "todayDate": "2024-03-15",
    "loggedCount": 50,
    "loggedAt": 1710518400000
  },
  "timestamp": 1710518400000
}
```

**Side Effects**:
- Inserts daily log into Redis sorted set
- Recalculates and caches metrics
- Updates session activity timestamp
- If challenge complete (currentDay >= duration), sets status to 'completed'
- Refreshes session TTL

---

### 5. Get Progress Logs

**Purpose**: Retrieve all daily logs for chart display (P3 user story)

**Route**: `GET /api/challenge/logs`

**Query Parameters**:
- `range` (optional): `all` (default), `last7`, `last30`

**Success Response** (200 OK):
```typescript
interface GetLogsResponse {
  success: true
  data: {
    logs: Array<{
      date: string        // YYYY-MM-DD
      pushups: number
      timestamp: number   // When logged
    }>
    challenge: {
      startDate: string
      duration: number
      currentDay: number
    }
  }
  timestamp: number
}
```

**Example**:
```json
{
  "success": true,
  "data": {
    "logs": [
      { "date": "2024-03-15", "pushups": 50, "timestamp": 1710518400000 },
      { "date": "2024-03-16", "pushups": 55, "timestamp": 1710604800000 },
      { "date": "2024-03-17", "pushups": 0, "timestamp": 1710691200000 },
      { "date": "2024-03-18", "pushups": 60, "timestamp": 1710777600000 }
    ],
    "challenge": {
      "startDate": "2024-03-15",
      "duration": 30,
      "currentDay": 10
    }
  },
  "timestamp": 1710864000000
}
```

**Error Responses**:

| Status | Error Code | Scenario |
|--------|------------|----------|
| 404 | NO_ACTIVE_CHALLENGE | No challenge to get logs for |
| 500 | INTERNAL_ERROR | Redis error |

**Notes**:
- Logs are sorted by date ascending
- Missing dates (missed days) are NOT included - client fills gaps for chart
- Includes logs with 0 pushups (FR-017)

---

### 6. Get Completion Summary

**Purpose**: Display completion screen (FR-015)

**Route**: `GET /api/challenge/summary`

**Success Response** (200 OK):
```typescript
interface CompletionSummaryResponse {
  success: true
  data: {
    totalPushups: number
    completionRate: number      // Percentage (FR-024)
    bestDay: {
      date: string              // YYYY-MM-DD
      pushups: number
    }
    finalStreak: number
    duration: number
    startDate: string
    completedAt: number          // Unix timestamp
  }
  timestamp: number
}
```

**Example**:
```json
{
  "success": true,
  "data": {
    "totalPushups": 1500,
    "completionRate": 93,
    "bestDay": {
      "date": "2024-03-25",
      "pushups": 85
    },
    "finalStreak": 12,
    "duration": 30,
    "startDate": "2024-03-15",
    "completedAt": 1713110400000
  },
  "timestamp": 1713110400000
}
```

**Error Responses**:

| Status | Error Code | Scenario |
|--------|------------|----------|
| 404 | NO_CHALLENGE | No challenge found |
| 400 | CHALLENGE_NOT_COMPLETED | Challenge status is not 'completed' |
| 500 | INTERNAL_ERROR | Redis error |

---

## Session Management

### Initialize Session

**Route**: `POST /api/session`

**Request Body**:
```typescript
interface InitSessionRequest {
  timezone: string  // IANA timezone
}
```

**Success Response** (201 Created):
```typescript
interface InitSessionResponse {
  success: true
  data: {
    sessionId: string
  }
  timestamp: number
}
```

**Side Effects**:
- Creates session in Redis
- Sets HttpOnly session cookie

**Notes**:
- Automatically called on first visit
- Not exposed to client (internal middleware)

---

### Get Session Status

**Route**: `GET /api/session`

**Success Response** (200 OK):
```typescript
interface SessionStatusResponse {
  success: true
  data: {
    sessionId: string
    hasActiveChallenge: boolean
    timezone: string
  }
  timestamp: number
}
```

---

## Rate Limiting

Currently NO rate limiting for MVP. Future considerations:

- 10 requests/minute per session for write operations (POST, DELETE)
- 60 requests/minute per session for read operations (GET)
- Implement using Vercel Edge Config or Upstash Rate Limiting

---

## CORS

CORS is disabled - API only accepts same-origin requests.

---

## Request/Response Examples (cURL)

### Create Challenge
```bash
curl -X POST https://push-track.vercel.app/api/challenge \
  -H "Content-Type: application/json" \
  -d '{"duration": 30}' \
  -c cookies.txt  # Save cookie
```

### Log Pushups
```bash
curl -X POST https://push-track.vercel.app/api/challenge/log \
  -H "Content-Type: application/json" \
  -d '{"pushups": 50}' \
  -b cookies.txt  # Use saved cookie
```

### Get Challenge Status
```bash
curl -X GET https://push-track.vercel.app/api/challenge \
  -b cookies.txt
```

---

## Type Definitions (TypeScript)

All types are defined in `lib/challenge/types.ts` and exported for client use:

```typescript
// lib/challenge/types.ts
export interface Challenge {
  id: string
  sessionId: string
  duration: number
  startDate: string
  status: 'active' | 'completed' | 'abandoned'
  createdAt: number
  completedAt?: number
}

export interface DailyLog {
  date: string
  pushups: number
  timestamp: number
  timezone: string
}

export interface ProgressMetrics {
  currentDay: number
  streak: number
  personalBest: number
  totalPushups: number
  daysLogged: number
  daysMissed: number
  completionRate: number
  calculatedAt: number
}

// API Request/Response types
export type CreateChallengeRequest = { duration: number }
export type LogPushupsRequest = { pushups: number }
// ... etc
```

---

## Next Steps

API contracts defined. Ready for:
1. Implementation of route handlers
2. Client-side API wrapper functions
3. Integration tests for each endpoint
