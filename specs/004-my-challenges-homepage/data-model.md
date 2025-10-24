# Data Model: localStorage Schema & TypeScript Types

**Feature**: Quick Challenge Access (004-my-challenges-homepage)
**Date**: 2025-10-24

## Overview

This document defines the localStorage data structure, TypeScript interfaces, and Zod validation schemas for the recent challenges feature. All types follow the project's existing patterns from `/lib/challenge/types.ts` and constitution requirements for type safety.

---

## 1. localStorage Storage Structure

### Key

```typescript
const STORAGE_KEY = 'push-track:recentChallenges' as const
```

**Rationale**: Namespaced with app prefix to avoid collisions with browser extensions or other scripts.

### Value (JSON)

```json
{
  "version": 1,
  "challenges": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "activities": ["Push-ups", "Pull-ups"],
      "duration": 30,
      "startDate": "2025-10-24",
      "lastVisited": 1729772400000,
      "url": "/challenge/550e8400-e29b-41d4-a716-446655440000"
    },
    {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "activities": ["Sit-ups"],
      "duration": 7,
      "startDate": "2025-10-20",
      "lastVisited": 1729686000000,
      "url": "/challenge/7c9e6679-7425-40de-944b-e07fc1f90ae7"
    }
  ]
}
```

**Storage Size Estimate**:
- Per challenge: ~200-300 bytes (depending on activity name lengths)
- 10 challenges: ~2-3KB
- 100 challenges: ~20-30KB
- Well within localStorage 5MB typical limit

---

## 2. TypeScript Interfaces

### RecentChallenge

```typescript
/**
 * Represents a single challenge saved to localStorage for quick access.
 *
 * This is a lightweight version of the full Challenge type from lib/challenge/types.ts,
 * containing only the data needed for display and navigation.
 */
export interface RecentChallenge {
  /**
   * Challenge UUID (same as full Challenge.id)
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  id: string

  /**
   * Array of 1-5 activity names selected by user
   * @example ["Push-ups", "Pull-ups", "Sit-ups"]
   */
  activities: string[]

  /**
   * Challenge duration in days (1-365)
   * @example 30
   */
  duration: number

  /**
   * Challenge start date in YYYY-MM-DD format (user's local timezone)
   * @example "2025-10-24"
   */
  startDate: string

  /**
   * Unix timestamp (milliseconds) of when challenge was last visited
   * Used for sorting challenges by recency
   * @example 1729772400000
   */
  lastVisited: number

  /**
   * Relative URL to challenge page
   * @example "/challenge/550e8400-e29b-41d4-a716-446655440000"
   */
  url: string
}
```

### StorageData (Wrapper)

```typescript
/**
 * Wrapper object for versioned localStorage data.
 * Allows for schema migrations in future versions.
 */
export interface StorageData {
  /**
   * Schema version for migration handling
   * Current version: 1
   */
  version: number

  /**
   * Array of recent challenges, sorted by lastVisited (descending)
   */
  challenges: RecentChallenge[]
}
```

---

## 3. Zod Validation Schemas

### RecentChallengeSchema

```typescript
import { z } from 'zod'

/**
 * Zod schema for runtime validation of RecentChallenge objects.
 * Ensures localStorage data integrity even if modified by devtools/extensions.
 */
export const RecentChallengeSchema = z.object({
  id: z.string().uuid({
    message: 'Challenge ID must be a valid UUID',
  }),

  activities: z.array(z.string().min(1).max(100))
    .min(1, 'At least one activity required')
    .max(5, 'Maximum 5 activities allowed'),

  duration: z.number()
    .int('Duration must be an integer')
    .min(1, 'Minimum duration is 1 day')
    .max(365, 'Maximum duration is 365 days'),

  startDate: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Start date must be in YYYY-MM-DD format'
  ),

  lastVisited: z.number()
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
```

### StorageDataSchema

```typescript
/**
 * Zod schema for the versioned localStorage wrapper.
 */
export const StorageDataSchema = z.object({
  version: z.number().int().positive(),
  challenges: z.array(RecentChallengeSchema),
})

export type StorageData = z.infer<typeof StorageDataSchema>
```

### RecentChallengesArraySchema (Convenience)

```typescript
/**
 * Schema for validating an array of RecentChallenge objects.
 * Used for direct validation of legacy data (version < 1) or unwrapped arrays.
 */
export const RecentChallengesArraySchema = z.array(RecentChallengeSchema)
```

---

## 4. Data Relationships

### Relationship to Existing Challenge Type

The `RecentChallenge` type is a **subset** of the full `Challenge` type from `/lib/challenge/types.ts`:

```typescript
// Full Challenge type (server-side, from Redis)
interface Challenge {
  id: string                     // ✅ Included in RecentChallenge
  duration: number               // ✅ Included
  startDate: string              // ✅ Included
  status: 'active' | 'completed' | 'abandoned'  // ❌ Not needed for display
  createdAt: number              // ❌ Not needed for display
  completedAt?: number           // ❌ Not needed for display
  timezone: string               // ❌ Not needed for display
  email?: string                 // ❌ Sensitive data, excluded
  activities: string[]           // ✅ Included
  activityUnits?: Record<string, ActivityUnit>  // ❌ Not needed for display
}

// RecentChallenge (client-side, localStorage)
interface RecentChallenge {
  id: string            // From Challenge
  activities: string[]  // From Challenge
  duration: number      // From Challenge
  startDate: string     // From Challenge
  lastVisited: number   // NEW: Client-side tracking
  url: string           // NEW: Derived from Challenge.id
}
```

**Conversion Function** (Challenge → RecentChallenge):

```typescript
import type { Challenge } from '@/lib/challenge/types'
import type { RecentChallenge } from '@/lib/localStorage/types'

export function challengeToRecentChallenge(challenge: Challenge): RecentChallenge {
  return {
    id: challenge.id,
    activities: challenge.activities,
    duration: challenge.duration,
    startDate: challenge.startDate,
    lastVisited: Date.now(),
    url: `/challenge/${challenge.id}`,
  }
}
```

---

## 5. State Transitions

### Adding a Challenge

```
User visits challenge page
  ↓
Extract Challenge data from server component props
  ↓
Convert to RecentChallenge (challengeToRecentChallenge)
  ↓
Validate with RecentChallengeSchema
  ↓
Load existing challenges from localStorage
  ↓
Remove duplicate (same ID) if exists
  ↓
Prepend new challenge to array
  ↓
Wrap in StorageData { version: 1, challenges: [...] }
  ↓
JSON.stringify and save to localStorage
```

### Loading Challenges

```
User visits homepage
  ↓
RecentChallenges component mounts
  ↓
Check mounted state (hydration guard)
  ↓
Read from localStorage
  ↓
JSON.parse
  ↓
Validate with StorageDataSchema
  ↓
Check version === 1 (or migrate)
  ↓
Sort challenges by lastVisited (descending)
  ↓
Render challenge cards
```

### Removing a Challenge (P3 Feature)

```
User clicks "remove" button
  ↓
Filter challenge out of array by ID
  ↓
Update localStorage with new array
  ↓
Re-render component (setState)
```

### Handling Corrupted Data

```
Read from localStorage
  ↓
JSON.parse throws SyntaxError
  ↓
Catch error
  ↓
Clear localStorage key
  ↓
Return empty array []
  ↓
Component shows empty state
```

---

## 6. Validation Rules Summary

| Field | Type | Constraints | Rationale |
|-------|------|-------------|-----------|
| `id` | string | Must be valid UUID | Ensures consistency with Challenge.id |
| `activities` | string[] | 1-5 items, each 1-100 chars | Matches Challenge creation constraints |
| `duration` | number | Integer, 1-365 | Matches Challenge creation constraints |
| `startDate` | string | YYYY-MM-DD format | Matches Challenge.startDate format |
| `lastVisited` | number | Positive integer (Unix ms) | Ensures valid timestamp for sorting |
| `url` | string | Starts with `/challenge/` | Prevents invalid navigation targets |
| `version` | number | Positive integer | Allows schema evolution |

---

## 7. Example Usage

### Saving a Challenge

```typescript
// app/challenge/[id]/page.tsx (Client Component wrapper)
'use client'

import { useEffect } from 'react'
import { saveRecentChallenge } from '@/lib/localStorage/recent-challenges'
import { challengeToRecentChallenge } from '@/lib/localStorage/utils'
import type { Challenge } from '@/lib/challenge/types'

interface Props {
  challenge: Challenge
}

export function ChallengePageClient({ challenge }: Props) {
  useEffect(() => {
    const recent = challengeToRecentChallenge(challenge)
    saveRecentChallenge(recent)
  }, [challenge])

  return (
    <div>
      {/* Challenge dashboard content */}
    </div>
  )
}
```

### Loading Challenges

```typescript
// components/recent-challenges.tsx
'use client'

import { useState, useEffect } from 'react'
import { getRecentChallengesSorted } from '@/lib/localStorage/recent-challenges'
import type { RecentChallenge } from '@/lib/localStorage/types'

export function RecentChallenges() {
  const [mounted, setMounted] = useState(false)
  const [challenges, setChallenges] = useState<RecentChallenge[]>([])

  useEffect(() => {
    setMounted(true)
    const recent = getRecentChallengesSorted()
    setChallenges(recent)
  }, [])

  if (!mounted || challenges.length === 0) {
    return null
  }

  return (
    <section>
      <h2>Your Recent Challenges</h2>
      <div className="grid gap-4">
        {challenges.map(challenge => (
          <ChallengeCard key={challenge.id} challenge={challenge} />
        ))}
      </div>
    </section>
  )
}
```

---

## 8. Migration Strategy (Future)

### Version 1 → Version 2 (Example)

Suppose we want to add a `lastActivityLogged` field in the future:

```typescript
// Version 2 schema
export const RecentChallengeSchemaV2 = RecentChallengeSchema.extend({
  lastActivityLogged?: z.string().optional(), // YYYY-MM-DD
})

// Migration function
function migrateV1toV2(data: StorageDataV1): StorageDataV2 {
  return {
    version: 2,
    challenges: data.challenges.map(c => ({
      ...c,
      lastActivityLogged: undefined, // Default for migrated data
    })),
  }
}

// In loadFromStorage()
const data = JSON.parse(raw) as StorageData

if (data.version === 1) {
  const migrated = migrateV1toV2(data)
  saveToStorage(migrated.challenges) // Re-save with new version
  return migrated.challenges
}
```

---

## 9. File Organization

```
lib/
└── localStorage/
    ├── types.ts                    # TypeScript interfaces + Zod schemas
    ├── recent-challenges.ts        # Core localStorage CRUD functions
    ├── utils.ts                    # Helper functions (challengeToRecentChallenge, sanitization)
    └── constants.ts                # STORAGE_KEY, STORAGE_VERSION constants
```

**Rationale**: Separate directory for localStorage-related code, mirroring `/lib/challenge/` structure.

---

## 10. Constants

```typescript
// lib/localStorage/constants.ts

/**
 * localStorage key for recent challenges data.
 * Namespaced to avoid collisions.
 */
export const STORAGE_KEY = 'push-track:recentChallenges' as const

/**
 * Current schema version for localStorage data.
 * Increment when making breaking changes to StorageData structure.
 */
export const STORAGE_VERSION = 1 as const

/**
 * Maximum number of challenges to store (optional limit for future).
 * Currently: No limit (display all)
 */
export const MAX_STORED_CHALLENGES = Number.POSITIVE_INFINITY
```

---

## Summary

### Key Data Structures

1. **RecentChallenge**: Lightweight challenge metadata for display
2. **StorageData**: Versioned wrapper for schema evolution
3. **Zod Schemas**: Runtime validation for type safety

### Design Principles

- **Type Safety**: Zod schemas provide runtime validation + TypeScript types
- **Simplicity**: Minimal data stored (6 fields per challenge)
- **Versioning**: Forward-compatible with `version` field
- **Validation**: All constraints match existing Challenge type rules
- **Performance**: Small JSON payloads, fast parse/stringify

### Files to Create

- `/lib/localStorage/types.ts` - Interfaces + schemas
- `/lib/localStorage/constants.ts` - Storage keys + version
- `/lib/localStorage/recent-challenges.ts` - CRUD operations
- `/lib/localStorage/utils.ts` - Conversion + sanitization helpers

---

**Phase 1 Data Model Complete** - Ready for contracts (N/A for client-only feature) and quickstart guide.
