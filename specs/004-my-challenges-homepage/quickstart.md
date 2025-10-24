# Quick Challenge Access: Development Guide

**Feature**: 004-my-challenges-homepage
**Date**: 2025-10-24

## Overview

This guide provides step-by-step instructions for implementing the Quick Challenge Access feature following the constitution's UI-First Development principle (Principle VI).

---

## Development Phases

### Phase 1: UI Prototype (Static Data) ✅ Constitution Principle VI

Build a functional, interactive UI with mock data before any localStorage or backend integration.

### Phase 2: localStorage Integration

Connect the UI to browser localStorage for data persistence.

### Phase 3: Challenge Page Integration

Add automatic save logic when users visit challenge pages.

### Phase 4: Polish & Testing

Handle edge cases, test on mobile viewports, and finalize UX.

---

## Phase 1: UI Prototype with Static Data

**Goal**: Create a visually complete, interactive component that can be demoed for design approval.

### Step 1.1: Create Mock Data File

```typescript
// lib/localStorage/mock-data.ts

import type { RecentChallenge } from './types'

export const MOCK_RECENT_CHALLENGES: RecentChallenge[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    activities: ['Push-ups', 'Pull-ups'],
    duration: 30,
    startDate: '2025-10-01',
    lastVisited: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    url: '/challenge/550e8400-e29b-41d4-a716-446655440000',
  },
  {
    id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    activities: ['Sit-ups'],
    duration: 7,
    startDate: '2025-10-20',
    lastVisited: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    url: '/challenge/7c9e6679-7425-40de-944b-e07fc1f90ae7',
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    activities: ['Plank', 'Squats', 'Lunges'],
    duration: 90,
    startDate: '2025-09-15',
    lastVisited: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
    url: '/challenge/123e4567-e89b-12d3-a456-426614174000',
  },
  // Edge case: Very long activity names
  {
    id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    activities: ['Super Long Activity Name That Should Be Truncated', 'Another Very Long Activity'],
    duration: 14,
    startDate: '2025-10-15',
    lastVisited: Date.now() - 1000 * 60 * 60 * 24 * 7, // 1 week ago
    url: '/challenge/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  },
]

// Empty state for testing
export const MOCK_EMPTY_CHALLENGES: RecentChallenge[] = []
```

### Step 1.2: Create RecentChallenges Component (Static Version)

```typescript
// components/recent-challenges.tsx
'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Trash2 } from 'lucide-react'
import { MOCK_RECENT_CHALLENGES } from '@/lib/localStorage/mock-data'

export function RecentChallenges() {
  // Phase 1: Use static mock data
  const challenges = MOCK_RECENT_CHALLENGES

  if (challenges.length === 0) {
    return null // Hide section when no challenges
  }

  return (
    <section className="w-full max-w-2xl space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Your Recent Challenges
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Quick access to your active challenges
        </p>
      </div>

      <div className="flex flex-col gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
        {challenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            onRemove={() => console.log('Remove:', challenge.id)} // Placeholder
          />
        ))}
      </div>
    </section>
  )
}

interface ChallengeCardProps {
  challenge: {
    id: string
    activities: string[]
    duration: number
    startDate: string
    lastVisited: number
    url: string
  }
  onRemove: () => void
}

function ChallengeCard({ challenge, onRemove }: ChallengeCardProps) {
  const relativeTime = getRelativeTime(challenge.lastVisited)

  return (
    <Card className="border-2 border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700 transition-all hover:shadow-lg group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">
              Your {challenge.duration}-Day Challenge
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              <span className="truncate inline-block max-w-[200px]">
                {challenge.activities.join(', ')}
              </span>
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.preventDefault()
              onRemove()
            }}
            aria-label="Remove challenge"
          >
            <Trash2 className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Link href={challenge.url} className="block">
          <Button variant="outline" className="w-full" size="lg">
            <Clock className="h-4 w-4 mr-2" />
            Continue Challenge
          </Button>
        </Link>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Last visited {relativeTime}
        </p>
      </CardContent>
    </Card>
  )
}

function getRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}
```

### Step 1.3: Add Component to Homepage

```typescript
// app/page.tsx

import { RecentChallenges } from '@/components/recent-challenges'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      <div className="max-w-2xl w-full space-y-12">
        {/* Hero Section */}
        {/* ... existing hero content ... */}

        {/* NEW: Recent Challenges Section */}
        <RecentChallenges />

        {/* CTA Card */}
        {/* ... existing CTA content ... */}

        {/* How It Works */}
        {/* ... existing content ... */}
      </div>
    </main>
  )
}
```

### Step 1.4: Test UI Prototype

**Mobile Testing** (320px, 375px viewports):
```bash
# Start dev server
npm run dev

# Open in browser
open http://localhost:3000

# Use Chrome DevTools
# - Toggle Device Toolbar (Cmd+Shift+M on Mac)
# - Select iPhone SE (375px) or custom 320px width
# - Test touch targets (should be ≥44x44px)
# - Verify text truncation works
# - Test hover states (on desktop)
# - Test remove button visibility
```

**Design Review Checklist**:
- [ ] Cards render correctly on 320px width
- [ ] Touch targets meet 44x44px minimum
- [ ] Activity names truncate with ellipsis
- [ ] Remove button appears on hover (desktop) or always visible (mobile)
- [ ] Gradients match homepage aesthetic
- [ ] Empty state hides section gracefully
- [ ] Relative time displays correctly

**🎯 Gate: Get design approval before proceeding to Phase 2**

---

## Phase 2: localStorage Integration

**Goal**: Connect UI to browser localStorage for data persistence.

### Step 2.1: Create TypeScript Types

```typescript
// lib/localStorage/types.ts

import { z } from 'zod'

export const RecentChallengeSchema = z.object({
  id: z.string().uuid(),
  activities: z.array(z.string().min(1).max(100)).min(1).max(5),
  duration: z.number().int().min(1).max(365),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lastVisited: z.number().int().positive(),
  url: z.string().startsWith('/challenge/'),
})

export const StorageDataSchema = z.object({
  version: z.number().int().positive(),
  challenges: z.array(RecentChallengeSchema),
})

export type RecentChallenge = z.infer<typeof RecentChallengeSchema>
export type StorageData = z.infer<typeof StorageDataSchema>
```

### Step 2.2: Create localStorage Constants

```typescript
// lib/localStorage/constants.ts

export const STORAGE_KEY = 'push-track:recentChallenges' as const
export const STORAGE_VERSION = 1 as const
```

### Step 2.3: Create localStorage Utility Functions

```typescript
// lib/localStorage/recent-challenges.ts

import { STORAGE_KEY, STORAGE_VERSION } from './constants'
import { StorageDataSchema, RecentChallengeSchema } from './types'
import type { RecentChallenge, StorageData } from './types'

/**
 * Save a challenge to localStorage.
 * Updates existing entry if challenge ID already exists.
 */
export function saveRecentChallenge(challenge: RecentChallenge): void {
  try {
    // Validate input
    const validated = RecentChallengeSchema.parse(challenge)

    // Load existing challenges
    const existing = getRecentChallenges()

    // Remove duplicate (same ID) and prepend new entry
    const updated = [
      validated,
      ...existing.filter((c) => c.id !== validated.id),
    ]

    // Wrap in versioned structure
    const data: StorageData = {
      version: STORAGE_VERSION,
      challenges: updated,
    }

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    if (error instanceof DOMException) {
      // localStorage unavailable (QuotaExceeded, SecurityError, etc.)
      console.warn('localStorage unavailable:', error.name)
    } else {
      console.error('Failed to save challenge to localStorage:', error)
    }
  }
}

/**
 * Load all recent challenges from localStorage.
 * Returns empty array if data is corrupted or unavailable.
 */
export function getRecentChallenges(): RecentChallenge[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)

    // Validate structure
    const validated = StorageDataSchema.safeParse(parsed)
    if (!validated.success) {
      console.warn('Invalid localStorage data, clearing:', validated.error)
      localStorage.removeItem(STORAGE_KEY)
      return []
    }

    // Check version
    if (validated.data.version !== STORAGE_VERSION) {
      console.warn('localStorage schema version mismatch, clearing')
      localStorage.removeItem(STORAGE_KEY)
      return []
    }

    return validated.data.challenges
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.warn('Corrupted localStorage data, clearing')
      localStorage.removeItem(STORAGE_KEY)
    } else if (error instanceof DOMException) {
      console.warn('localStorage unavailable:', error.name)
    } else {
      console.error('Failed to load challenges from localStorage:', error)
    }
    return []
  }
}

/**
 * Get recent challenges sorted by lastVisited (descending).
 */
export function getRecentChallengesSorted(): RecentChallenge[] {
  const challenges = getRecentChallenges()
  return challenges.sort((a, b) => b.lastVisited - a.lastVisited)
}

/**
 * Remove a challenge by ID.
 */
export function removeRecentChallenge(id: string): void {
  try {
    const existing = getRecentChallenges()
    const filtered = existing.filter((c) => c.id !== id)

    const data: StorageData = {
      version: STORAGE_VERSION,
      challenges: filtered,
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to remove challenge from localStorage:', error)
  }
}

/**
 * Clear all recent challenges.
 */
export function clearRecentChallenges(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear localStorage:', error)
  }
}
```

### Step 2.4: Update RecentChallenges Component

```typescript
// components/recent-challenges.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Trash2 } from 'lucide-react'
import { getRecentChallengesSorted, removeRecentChallenge } from '@/lib/localStorage/recent-challenges'
import type { RecentChallenge } from '@/lib/localStorage/types'

export function RecentChallenges() {
  const [mounted, setMounted] = useState(false)
  const [challenges, setChallenges] = useState<RecentChallenge[]>([])

  useEffect(() => {
    setMounted(true)
    const recent = getRecentChallengesSorted()
    setChallenges(recent)
  }, [])

  const handleRemove = (id: string) => {
    removeRecentChallenge(id)
    setChallenges((prev) => prev.filter((c) => c.id !== id))
  }

  // Don't render until mounted (hydration safety)
  if (!mounted) {
    return null
  }

  // Hide section if no challenges
  if (challenges.length === 0) {
    return null
  }

  return (
    <section className="w-full max-w-2xl space-y-6">
      {/* ... same JSX as Phase 1, but with handleRemove callback ... */}
      <div className="flex flex-col gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
        {challenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            onRemove={() => handleRemove(challenge.id)}
          />
        ))}
      </div>
    </section>
  )
}

// ... rest of component (ChallengeCard, getRelativeTime) same as Phase 1 ...
```

### Step 2.5: Test localStorage Integration

```bash
# Start dev server
npm run dev
```

**Manual Testing**:
1. Open browser devtools → Application tab → localStorage
2. Verify `push-track:recentChallenges` key appears (initially empty)
3. Manually add test data:
   ```json
   {
     "version": 1,
     "challenges": [
       {
         "id": "550e8400-e29b-41d4-a716-446655440000",
         "activities": ["Push-ups"],
         "duration": 30,
         "startDate": "2025-10-24",
         "lastVisited": 1729772400000,
         "url": "/challenge/550e8400-e29b-41d4-a716-446655440000"
       }
     ]
   }
   ```
4. Refresh page → component should render challenge
5. Click "remove" button → challenge should disappear
6. Verify localStorage updated

**Edge Case Testing**:
- [ ] Corrupted JSON: Set value to `{invalid` → should clear and show empty
- [ ] Wrong version: Set `version: 999` → should clear and show empty
- [ ] Invalid UUID: Set `id: "not-a-uuid"` → should clear and show empty
- [ ] Missing field: Remove `activities` → should clear and show empty
- [ ] localStorage disabled: Open in incognito, disable storage → should hide gracefully

---

## Phase 3: Challenge Page Integration

**Goal**: Automatically save challenges when users visit challenge pages.

### Step 3.1: Create Conversion Utility

```typescript
// lib/localStorage/utils.ts

import type { Challenge } from '@/lib/challenge/types'
import type { RecentChallenge } from './types'

/**
 * Convert full Challenge object to RecentChallenge for localStorage.
 */
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

### Step 3.2: Add Client Component to Challenge Page

```typescript
// components/challenge/save-to-recent.tsx
'use client'

import { useEffect } from 'react'
import { saveRecentChallenge } from '@/lib/localStorage/recent-challenges'
import { challengeToRecentChallenge } from '@/lib/localStorage/utils'
import type { Challenge } from '@/lib/challenge/types'

interface Props {
  challenge: Challenge
}

/**
 * Invisible component that saves challenge to localStorage on mount.
 * Placed in challenge page Server Component.
 */
export function SaveToRecent({ challenge }: Props) {
  useEffect(() => {
    const recent = challengeToRecentChallenge(challenge)
    saveRecentChallenge(recent)
  }, [challenge])

  return null // No UI
}
```

### Step 3.3: Update Challenge Page

```typescript
// app/challenge/[id]/page.tsx

import { SaveToRecent } from '@/components/challenge/save-to-recent'
import { Dashboard } from '@/components/challenge/dashboard'

export default async function ChallengePage({ params }: { params: { id: string } }) {
  // Existing server-side data fetching
  const response = await fetch(`http://localhost:3000/api/challenge/${params.id}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    notFound()
  }

  const { data: challenge } = await response.json()

  return (
    <>
      {/* NEW: Invisible component to save to localStorage */}
      <SaveToRecent challenge={challenge} />

      {/* Existing dashboard */}
      <Dashboard challenge={challenge} />
    </>
  )
}
```

### Step 3.4: Test End-to-End Flow

1. Clear localStorage (devtools → Application → Clear storage)
2. Visit `/challenge/create` and create a new challenge
3. Get redirected to `/challenge/{id}`
4. Open devtools → localStorage → verify challenge saved
5. Navigate to homepage (`/`)
6. Verify challenge appears in "Your Recent Challenges"
7. Click challenge card → should navigate back to challenge
8. Return to homepage → challenge should move to top (updated `lastVisited`)

---

## Phase 4: Polish & Testing

### Step 4.1: Add Sanitization (XSS Prevention)

```typescript
// lib/utils.ts (add to existing file)

/**
 * Sanitize user-generated text to prevent XSS.
 * Note: React JSX already escapes by default, this is defense-in-depth.
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}
```

Update ChallengeCard to use sanitization:

```typescript
// components/recent-challenges.tsx

import { sanitizeText } from '@/lib/utils'

// In ChallengeCard:
<CardDescription className="text-sm mt-1">
  <span className="truncate inline-block max-w-[200px]">
    {sanitizeText(challenge.activities.join(', '))}
  </span>
</CardDescription>
```

### Step 4.2: Mobile Viewport Testing

```bash
# Chrome DevTools testing
# 1. iPhone SE (375x667)
# 2. iPhone 12 Pro (390x844)
# 3. Samsung Galaxy S20 (360x800)
# 4. Custom 320px width
```

**Checklist**:
- [ ] Touch targets ≥44x44px (measure "Continue Challenge" button)
- [ ] Cards render correctly at 320px
- [ ] Text truncation works on long activity names
- [ ] Remove button accessible (always visible on mobile, not just hover)
- [ ] No horizontal scrolling
- [ ] Spacing feels comfortable (16px gaps)

### Step 4.3: Dark Mode Testing

```bash
# Toggle dark mode via theme-toggle component
# Verify:
# - Text contrast (4.5:1 ratio)
# - Card borders visible
# - Hover states visible
# - Gradients render correctly
```

### Step 4.4: TypeScript & Linting

```bash
# Run type checking
npm run lint

# Expected: No errors related to new files
```

### Step 4.5: Performance Testing

```bash
# Lighthouse audit (Chrome DevTools → Lighthouse)
# Run on homepage with 10 saved challenges

# Expected metrics:
# - Performance: 90+ score
# - First Contentful Paint: <1.5s
# - Time to Interactive: <3s
# - localStorage read time: <10ms (check via Performance tab)
```

---

## Testing Checklist

### Functional Testing

- [ ] Challenge saved when visiting challenge page
- [ ] Challenge appears on homepage
- [ ] Multiple challenges display correctly
- [ ] Challenges sorted by lastVisited (most recent first)
- [ ] Clicking challenge navigates to correct URL
- [ ] Remove button removes challenge
- [ ] Empty state hides section
- [ ] Duplicate challenge (same ID) updates existing entry

### Error Handling

- [ ] Corrupted localStorage data cleared gracefully
- [ ] Invalid version number cleared gracefully
- [ ] localStorage unavailable (incognito) hides feature
- [ ] Missing required fields cleared gracefully
- [ ] Invalid UUID cleared gracefully

### Mobile Testing (320px, 375px)

- [ ] Cards render correctly
- [ ] Touch targets ≥44x44px
- [ ] Text truncation works
- [ ] No horizontal scroll
- [ ] Remove button accessible

### Desktop Testing (1024px+)

- [ ] Grid layout (2-3 columns) renders
- [ ] Hover states work
- [ ] Remove button appears on hover

### Dark Mode

- [ ] Text contrast sufficient
- [ ] Borders visible
- [ ] Gradients render correctly

### Performance

- [ ] localStorage read <10ms
- [ ] Homepage render <100ms additional time
- [ ] No layout shifts (CLS = 0)
- [ ] No hydration errors in console

---

## Deployment Checklist

Before merging to main:

- [ ] All TypeScript errors resolved (`npm run lint`)
- [ ] Mobile testing complete (320px, 375px)
- [ ] Dark mode tested
- [ ] localStorage error handling tested
- [ ] Constitution principles verified:
  - [ ] Mobile-first ✅
  - [ ] Simplicity ✅
  - [ ] Type safety ✅
  - [ ] Progressive enhancement ✅
  - [ ] Observability ✅
  - [ ] UI-first workflow ✅
- [ ] Design approval obtained
- [ ] Manual testing passed

---

## Common Issues & Solutions

### Issue: Hydration Error

**Symptom**: Console warning about mismatched text content

**Solution**: Ensure `mounted` state guard is used:
```typescript
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
if (!mounted) return null
```

### Issue: localStorage Quota Exceeded

**Symptom**: `QuotaExceededError` thrown

**Solution**: Implement max challenges limit (future enhancement) or clear old entries

### Issue: Challenge Not Appearing

**Symptom**: Visit challenge page but homepage shows nothing

**Steps to Debug**:
1. Check browser console for errors
2. Open devtools → Application → localStorage
3. Verify `push-track:recentChallenges` key exists
4. Verify JSON structure matches schema
5. Check `SaveToRecent` component is mounted on challenge page

### Issue: Text Not Truncating

**Symptom**: Long activity names overflow container

**Solution**: Ensure Tailwind classes applied:
```tsx
<span className="truncate inline-block max-w-[200px]">
  {text}
</span>
```

---

## Next Steps (Post-MVP)

### P2: Display All Challenges
- Currently implemented (no limit)
- Could add "Show more" pagination if performance degrades

### P3: Manual Remove Button
- Already implemented in prototype
- Polish hover states and confirmation dialog

### Future Enhancements
- **Cross-device sync**: Requires user authentication (major feature)
- **Challenge status badges**: "Active", "Completed", "2 days left"
- **Last activity logged**: Show date of last logged activity
- **Stale challenge warnings**: Dim challenges not visited in 30+ days

---

## Files Created

```
lib/
└── localStorage/
    ├── types.ts                 # TypeScript interfaces + Zod schemas
    ├── constants.ts             # STORAGE_KEY, STORAGE_VERSION
    ├── recent-challenges.ts     # CRUD functions
    ├── utils.ts                 # challengeToRecentChallenge, sanitization
    └── mock-data.ts             # Mock data for UI prototype (remove in production)

components/
├── recent-challenges.tsx        # Main UI component
└── challenge/
    └── save-to-recent.tsx       # Auto-save helper component

app/
├── page.tsx                     # Homepage (modified to include RecentChallenges)
└── challenge/[id]/page.tsx      # Challenge page (modified to include SaveToRecent)
```

---

**Development Ready** - Follow phases sequentially, get design approval after Phase 1, then proceed with localStorage integration.
