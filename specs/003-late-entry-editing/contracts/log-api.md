# API Contract: Challenge Log Endpoint (Extended)

**Endpoint**: `POST /api/challenge/[id]/log`
**Feature**: Late Entry Editing
**Date**: 2025-10-24

## Overview

This endpoint logs activity data for a challenge. It now supports an optional `date` parameter to enable editing past entries. When `date` is omitted, it defaults to today (existing behavior).

---

## Request

### HTTP Method
`POST`

### URL Pattern
```
/api/challenge/{challengeId}/log
```

### Path Parameters

| Parameter | Type | Description | Validation |
|-----------|------|-------------|------------|
| `challengeId` | string | Unique challenge identifier | UUID format, URL-encoded |

### Query Parameters

None. Date is passed in request body.

### Request Headers

| Header | Required | Value |
|--------|----------|-------|
| `Content-Type` | Yes | `application/json` |

### Request Body

**TypeScript Interface**:
```typescript
interface LogRepsRequest {
  logs: Array<{
    activity: string;
    reps: number;
  }>;
  date?: string;  // NEW: Optional ISO date (YYYY-MM-DD)
}
```

**JSON Schema**:
```json
{
  "type": "object",
  "required": ["logs"],
  "properties": {
    "logs": {
      "type": "array",
      "minItems": 1,
      "maxItems": 5,
      "items": {
        "type": "object",
        "required": ["activity", "reps"],
        "properties": {
          "activity": {
            "type": "string",
            "minLength": 1,
            "maxLength": 50
          },
          "reps": {
            "type": "integer",
            "minimum": 0,
            "maximum": 10000
          }
        }
      }
    },
    "date": {
      "type": "string",
      "format": "date",
      "description": "ISO 8601 date (YYYY-MM-DD). Defaults to today if omitted."
    }
  }
}
```

**Example Requests**:

```json
// Example 1: Log current day (existing behavior, no date parameter)
POST /api/challenge/abc123/log
{
  "logs": [
    { "activity": "Push-ups", "reps": 50 },
    { "activity": "Sit-ups", "reps": 30 }
  ]
}

// Example 2: Edit past day (new behavior, date parameter provided)
POST /api/challenge/abc123/log
{
  "logs": [
    { "activity": "Push-ups", "reps": 42 }
  ],
  "date": "2025-10-20"
}

// Example 3: Add missed day data (date parameter with previously unlogged date)
POST /api/challenge/abc123/log
{
  "logs": [
    { "activity": "Running", "reps": 5 }
  ],
  "date": "2025-10-18"
}
```

---

## Response

### Success Response (200 OK)

**TypeScript Interface**:
```typescript
interface ActivityMetrics {
  streak: number;           // Consecutive days logged
  personalBest: number;     // Highest single-day reps
  totalReps: number;        // Sum of all reps
  currentDay: number;       // Current day number in challenge
}

interface LogRepsResponse {
  logs: Array<{
    date: string;           // ISO date
    activity: string;
    reps: number;
  }>;
  activityMetrics: Record<string, ActivityMetrics>;
  challengeCompleted: boolean;
}
```

**Example Response**:
```json
{
  "logs": [
    { "date": "2025-10-20", "activity": "Push-ups", "reps": 42 }
  ],
  "activityMetrics": {
    "Push-ups": {
      "streak": 5,
      "personalBest": 60,
      "totalReps": 420,
      "currentDay": 10
    }
  },
  "challengeCompleted": false
}
```

---

## Error Responses

### 400 Bad Request

**Scenario 1: Missing activities**
```json
{
  "error": "MISSING_ACTIVITIES",
  "message": "Challenge has activities [Push-ups, Sit-ups] but request only included [Push-ups]"
}
```

**Scenario 2: Invalid activities**
```json
{
  "error": "INVALID_ACTIVITIES",
  "message": "Activity 'Jumping Jacks' is not part of this challenge"
}
```

**Scenario 3: Invalid date format**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid date format. Expected ISO 8601 (YYYY-MM-DD)"
}
```

**Scenario 4: Future date**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Cannot edit future dates"
}
```

**Scenario 5: Date before challenge start**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Date 2025-09-01 is before challenge start date 2025-10-01"
}
```

**Scenario 6: Invalid reps value**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Reps must be between 0 and 10,000"
}
```

### 403 Forbidden

**Scenario: Challenge completed**
```json
{
  "error": "CHALLENGE_COMPLETED",
  "message": "Challenge has already been completed"
}
```

*Note*: This error is removed for edit mode (per edge case: "allow historical editing for record accuracy"). Completed challenges can have their logs edited.

### 404 Not Found

**Scenario: Challenge not found**
```json
{
  "error": "NO_ACTIVE_CHALLENGE",
  "message": "Challenge abc123 not found"
}
```

### 409 Conflict

**Scenario: Already logged today**
```json
{
  "error": "ALREADY_LOGGED_TODAY",
  "message": "You have already logged Push-ups for today. Use the edit function to update."
}
```

*Behavior Change*: When `date` parameter is provided (edit mode), this error is **NOT** thrown. Edits are allowed to overwrite existing entries.

### 500 Internal Server Error

**Scenario: Redis operation failure**
```json
{
  "error": "INTERNAL_ERROR",
  "message": "Failed to save activity log"
}
```

---

## Validation Rules

### Request Validation

| Rule | Check | Error Code | Message |
|------|-------|------------|---------|
| Logs array not empty | `logs.length > 0` | 400 | "Logs array cannot be empty" |
| Max 5 activities | `logs.length <= 5` | 400 | "Cannot log more than 5 activities" |
| Activity name length | `activity.length >= 1 && <= 50` | 400 | "Activity name must be 1-50 characters" |
| Reps range | `reps >= 0 && reps <= 10000` | 400 | "Reps must be between 0 and 10,000" |
| Date format | ISO 8601 (YYYY-MM-DD) | 400 | "Invalid date format" |
| Date not future | `date <= today` | 400 | "Cannot edit future dates" |
| Date within challenge | `date >= startDate && date < startDate + duration` | 400 | "Date outside challenge period" |

### Business Logic Validation

| Rule | Check | Error Code | Message |
|------|-------|------------|---------|
| Challenge exists | Challenge found in Redis | 404 | "Challenge not found" |
| All activities included | All challenge activities in request | 400 | "Missing activities: [list]" |
| No extra activities | No activities outside challenge | 400 | "Invalid activities: [list]" |
| Challenge not completed | `status !== 'completed'` (unless editing) | 403 | "Challenge completed" (suppressed for edits) |
| Already logged check | First log for date+activity (unless editing) | 409 | "Already logged" (suppressed for edits) |

---

## Behavior Differences: Log Mode vs Edit Mode

| Aspect | Log Mode (`date` omitted) | Edit Mode (`date` provided) |
|--------|---------------------------|----------------------------|
| Target date | Today | Specified date |
| Duplicate check | Prevents duplicate logs for today (409 error) | Allows overwriting existing logs |
| Completed challenge | Prevents logging (403 error) | Allows editing (no error) |
| Future dates | N/A (always targets today) | Blocked (400 error) |
| Partial updates | Must include all activities (400 if missing) | Same (must include all activities) |

---

## Implementation Notes

### Backward Compatibility

- Existing clients without `date` parameter continue working unchanged
- `date` parameter is optional (defaults to today)
- Response structure unchanged (no new fields)

### Idempotency

- **Log Mode**: Not idempotent (409 error on duplicate)
- **Edit Mode**: Idempotent (same request produces same result)

### Concurrency

- Redis ZADD is atomic
- Last write wins (no optimistic locking)
- Edge case: Simultaneous edits to same date+activity → last request wins

### Performance

- Same Redis operations as existing log endpoint
- No additional queries required
- Expected latency: < 500ms (meets spec requirement)

---

## Testing Scenarios

### Happy Path Tests

1. **Log current day** (existing behavior)
   - Request: `{ logs: [...] }` (no date)
   - Expected: 200 OK, logs saved with today's date

2. **Edit past day with new data**
   - Request: `{ logs: [...], date: "2025-10-20" }` (no existing log)
   - Expected: 200 OK, new log created for specified date

3. **Edit past day with existing data**
   - Request: `{ logs: [...], date: "2025-10-20" }` (log exists)
   - Expected: 200 OK, existing log updated

4. **Partial update in multi-activity challenge**
   - Request: `{ logs: [{ activity: "Push-ups", reps: 50 }], date: "2025-10-20" }`
   - Expected: 200 OK, only Push-ups updated, other activities unchanged

### Error Case Tests

5. **Future date rejection**
   - Request: `{ logs: [...], date: "2025-12-31" }` (tomorrow)
   - Expected: 400, "Cannot edit future dates"

6. **Date before challenge start**
   - Request: `{ logs: [...], date: "2025-09-01" }` (before start)
   - Expected: 400, "Date before challenge start"

7. **Invalid date format**
   - Request: `{ logs: [...], date: "10/20/2025" }`
   - Expected: 400, "Invalid date format"

8. **Missing activities in multi-activity challenge**
   - Request: `{ logs: [{ activity: "Push-ups", reps: 50 }], date: "2025-10-20" }` (Sit-ups missing)
   - Expected: 400, "Missing activities: [Sit-ups]"

9. **Invalid activity name**
   - Request: `{ logs: [{ activity: "Invalid", reps: 50 }] }`
   - Expected: 400, "Invalid activities: [Invalid]"

10. **Negative reps**
    - Request: `{ logs: [{ activity: "Push-ups", reps: -5 }] }`
    - Expected: 400, "Reps must be between 0 and 10,000"

11. **Challenge not found**
    - Request to `/api/challenge/nonexistent/log`
    - Expected: 404, "Challenge not found"

### Edge Case Tests

12. **Edit completed challenge**
    - Request: `{ logs: [...], date: "2025-10-10" }` (challenge completed)
    - Expected: 200 OK (allows historical edits per spec edge case)

13. **Set reps to 0 (mark as missed)**
    - Request: `{ logs: [{ activity: "Push-ups", reps: 0 }], date: "2025-10-20" }`
    - Expected: 200 OK, creates missed-day entry (red bar in chart)

14. **Concurrent edits to same day**
    - Two simultaneous requests for same date+activity
    - Expected: Both return 200, last write wins

---

## OpenAPI Specification

```yaml
openapi: 3.0.0
info:
  title: Push-Track API
  version: 1.1.0
paths:
  /api/challenge/{challengeId}/log:
    post:
      summary: Log or edit activity data
      description: |
        Logs activity data for a challenge. Supports both current-day logging
        (default) and editing past entries (when date parameter is provided).
      parameters:
        - name: challengeId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - logs
              properties:
                logs:
                  type: array
                  minItems: 1
                  maxItems: 5
                  items:
                    type: object
                    required:
                      - activity
                      - reps
                    properties:
                      activity:
                        type: string
                        minLength: 1
                        maxLength: 50
                      reps:
                        type: integer
                        minimum: 0
                        maximum: 10000
                date:
                  type: string
                  format: date
                  description: ISO 8601 date (YYYY-MM-DD). Defaults to today if omitted.
            examples:
              logToday:
                summary: Log current day
                value:
                  logs:
                    - activity: Push-ups
                      reps: 50
              editPastDay:
                summary: Edit past day
                value:
                  logs:
                    - activity: Push-ups
                      reps: 42
                  date: "2025-10-20"
      responses:
        '200':
          description: Successfully logged activity
          content:
            application/json:
              schema:
                type: object
                properties:
                  logs:
                    type: array
                    items:
                      type: object
                      properties:
                        date:
                          type: string
                          format: date
                        activity:
                          type: string
                        reps:
                          type: integer
                  activityMetrics:
                    type: object
                    additionalProperties:
                      type: object
                      properties:
                        streak:
                          type: integer
                        personalBest:
                          type: integer
                        totalReps:
                          type: integer
                        currentDay:
                          type: integer
                  challengeCompleted:
                    type: boolean
        '400':
          description: Bad request (validation error)
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                  message:
                    type: string
        '403':
          description: Forbidden (challenge completed, not applicable for edits)
        '404':
          description: Challenge not found
        '409':
          description: Already logged today (not applicable for edits)
        '500':
          description: Internal server error
```

---

## Summary

**Changes from Existing API**:
1. Added optional `date` parameter to request body
2. Suppressed 409 error when `date` is provided (edit mode)
3. Suppressed 403 error for completed challenges when editing
4. Added date validation rules (format, not future, within challenge)

**Backward Compatibility**: ✅ Fully compatible
- Omitting `date` behaves exactly as before
- Existing clients require no changes

**Performance Impact**: Negligible
- Same Redis operations
- Additional date validation adds ~1-2ms

**Security Considerations**:
- Date validation prevents future-date tampering
- URL-based challenge ID already provides isolation
- No new authorization logic required
