# Research: localStorage Best Practices & Patterns

**Feature**: Quick Challenge Access (004-my-challenges-homepage)
**Date**: 2025-10-24

## Overview

This document consolidates research findings for implementing a robust localStorage-based feature in Next.js 14 with TypeScript. The focus is on hydration-safe patterns, data sanitization, error handling, and mobile-first considerations.

---

## 1. localStorage in Next.js App Router (React 18+)

### Decision: Use Client Components with Hydration Guards

**Rationale**:
- Next.js Server Components render on the server where `window.localStorage` is undefined
- Client Components with `'use client'` directive enable safe browser API access
- Hydration mismatches occur if localStorage is read during initial render

**Pattern** (from project's `theme-toggle.tsx`):
```typescript
'use client'

import { useState, useEffect } from 'react'

export function RecentChallenges() {
  const [mounted, setMounted] = useState(false)
  const [challenges, setChallenges] = useState<RecentChallenge[]>([])

  useEffect(() => {
    setMounted(true)
    // Safe to access localStorage here
    const saved = localStorage.getItem('recentChallenges')
    if (saved) {
      setChallenges(JSON.parse(saved))
    }
  }, [])

  if (!mounted) {
    return null // or skeleton loader
  }

  return <div>{/* Render challenges */}</div>
}
```

**Alternatives Considered**:
1. **Dynamic imports with `ssr: false`**: More boilerplate, less explicit
2. **`typeof window !== 'undefined'` checks**: Still causes hydration warnings
3. **Server Component with dynamic import**: Adds unnecessary complexity

**Recommendation**: Hydration guard pattern (mounted state) is simplest and aligns with existing codebase patterns.

---

## 2. Data Sanitization & XSS Prevention

### Decision: Sanitize Activity Names Before Rendering

**Rationale**:
- Activity names come from user input (challenge creation form)
- Stored in localStorage as plain strings
- Could contain malicious scripts if not sanitized
- React's JSX auto-escapes by default, but explicit sanitization adds defense-in-depth

**Pattern**:
```typescript
// lib/utils.ts or lib/localStorage/sanitize.ts
export function sanitizeText(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// Usage
<span>{sanitizeText(challenge.activities[0])}</span>
```

**Alternatives Considered**:
1. **DOMPurify library**: Overkill for simple text sanitization (adds 45KB)
2. **Rely solely on React's JSX escaping**: Adequate but not explicit
3. **HTML entity encoding library (he)**: Good option but adds dependency

**Recommendation**: Manual escape function in `lib/utils.ts` - zero dependencies, explicit intent, sufficient for plain text.

**Note**: React's `{expression}` in JSX automatically escapes HTML entities, so this is defense-in-depth. The primary risk is if data were ever injected via `dangerouslySetInnerHTML` (which we won't use).

---

## 3. localStorage Error Handling

### Decision: Try-Catch with Graceful Degradation

**Rationale**:
- localStorage can throw `QuotaExceededError` when full
- Can throw `SecurityError` in private browsing (Safari, Firefox)
- Can be disabled by user or enterprise policy
- Feature should degrade gracefully without breaking homepage

**Pattern**:
```typescript
// lib/localStorage/recent-challenges.ts

function saveChallenge(challenge: RecentChallenge): void {
  try {
    const existing = getRecentChallenges()
    const updated = [challenge, ...existing.filter(c => c.id !== challenge.id)]
    localStorage.setItem('recentChallenges', JSON.stringify(updated))
  } catch (error) {
    if (error instanceof DOMException) {
      // QuotaExceededError, SecurityError, etc.
      console.warn('localStorage unavailable:', error.name)
      // Silently fail - feature hidden
    } else {
      console.error('Unexpected error saving to localStorage:', error)
    }
  }
}

function getRecentChallenges(): RecentChallenge[] {
  try {
    const raw = localStorage.getItem('recentChallenges')
    if (!raw) return []

    const parsed = JSON.parse(raw)

    // Validate structure with Zod
    const validated = RecentChallengesSchema.safeParse(parsed)
    if (!validated.success) {
      console.warn('Invalid localStorage data, clearing:', validated.error)
      localStorage.removeItem('recentChallenges')
      return []
    }

    return validated.data
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.warn('Corrupted localStorage data, clearing')
      localStorage.removeItem('recentChallenges')
    } else if (error instanceof DOMException) {
      console.warn('localStorage unavailable:', error.name)
    }
    return []
  }
}
```

**Alternatives Considered**:
1. **No error handling**: Breaks feature catastrophically
2. **Alert/toast to user**: Unnecessary noise for enhancement feature
3. **Fallback to cookies**: Adds complexity, cookies have size limits
4. **Fallback to sessionStorage**: Same availability issues as localStorage

**Recommendation**: Silent failure with console warnings for debugging. Feature is progressive enhancement, so absence shouldn't impact core functionality.

---

## 4. Data Validation with Zod

### Decision: Validate localStorage Data on Read

**Rationale**:
- localStorage can be modified by browser devtools or extensions
- Data structure may evolve over time (schema migrations)
- Type safety at runtime prevents crashes from malformed data

**Schema**:
```typescript
// lib/localStorage/types.ts

import { z } from 'zod'

export const RecentChallengeSchema = z.object({
  id: z.string().uuid(),
  activities: z.array(z.string()).min(1).max(5),
  duration: z.number().int().min(1).max(365),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  lastVisited: z.number().int().positive(), // Unix timestamp (ms)
  url: z.string().url(), // /challenge/{id}
})

export const RecentChallengesSchema = z.array(RecentChallengeSchema)

export type RecentChallenge = z.infer<typeof RecentChallengeSchema>
```

**Alternatives Considered**:
1. **Runtime type assertions (TypeScript `as`)**: No runtime validation, unsafe
2. **Manual validation**: Error-prone, verbose, not DRY
3. **JSON Schema**: Less ergonomic than Zod in TypeScript projects

**Recommendation**: Zod schemas - already used extensively in codebase, provides runtime validation + TypeScript types.

---

## 5. Text Truncation Strategy

### Decision: CSS Truncation with Ellipsis

**Rationale**:
- Activity names can be arbitrarily long (user-entered)
- Mobile screens have limited width (320px minimum)
- CSS truncation is performant and accessible

**Pattern**:
```tsx
// Tailwind classes for truncation
<span className="truncate max-w-[200px] inline-block">
  {sanitizeText(challenge.activities.join(', '))}
</span>

// Or for multiline truncation
<p className="line-clamp-2">
  {sanitizeText(challenge.activities.join(', '))}
</p>
```

**CSS equivalent**:
```css
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
```

**Alternatives Considered**:
1. **JavaScript substring with manual ellipsis**: Doesn't account for character widths
2. **Tooltip on hover**: Good for desktop, poor for mobile (no hover)
3. **Expandable text**: Adds complexity, violates simplicity principle

**Recommendation**: CSS `truncate` utility (Tailwind) for single-line, `line-clamp-2` for multi-line. Accessible (screen readers read full text), performant (no JS), and responsive.

---

## 6. Challenge Validation Strategy

### Decision: Client-Side ID Validation Only (No API Calls)

**Rationale**:
- Validating challenge existence requires API call to `/api/challenge/{id}`
- API calls on every homepage load violate performance targets (<100ms render)
- Feature is best-effort - stale data acceptable for quick access
- Invalid challenges silently removed when user clicks (404 handling)

**Pattern**:
```typescript
// When user clicks challenge link
<Link href={`/challenge/${challenge.id}`}>
  {/* Challenge card */}
</Link>

// If challenge deleted, Next.js routing shows 404
// On next homepage visit, user can manually remove via dismiss button
```

**Alternatives Considered**:
1. **Validate all challenges on homepage load**: 3-10 API calls, slow
2. **Validate in background (setTimeout)**: Adds complexity, delayed cleanup
3. **Server-side validation in Homepage Server Component**: Couples feature to server logic

**Recommendation**: No proactive validation. Let natural navigation handle stale data. Implement manual "remove" button for user cleanup (P3 feature).

---

## 7. Sorting & Ordering Strategy

### Decision: Sort by `lastVisited` Timestamp (Descending)

**Rationale**:
- Most recently visited challenges are most likely to be active
- Timestamp stored in localStorage on each visit
- Simple array sort, no complex logic

**Pattern**:
```typescript
function getRecentChallengesSorted(): RecentChallenge[] {
  const challenges = getRecentChallenges()
  return challenges.sort((a, b) => b.lastVisited - a.lastVisited)
}
```

**Alternatives Considered**:
1. **Sort by start date**: Doesn't reflect user behavior (multiple old challenges)
2. **Sort by challenge status (active first)**: Requires API calls to check status
3. **Manual user ordering (drag-and-drop)**: Overkill for MVP

**Recommendation**: Timestamp-based sorting - simple, automatic, reflects user intent.

---

## 8. Mobile-First UI Considerations

### Decision: Vertical Card Stack on Mobile, Grid on Desktop

**Rationale**:
- Mobile users (primary audience) need thumb-reachable targets
- Vertical stack maximizes touch target height
- Desktop can leverage horizontal space

**Pattern**:
```tsx
<div className="flex flex-col gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
  {challenges.map(challenge => (
    <ChallengeCard key={challenge.id} challenge={challenge} />
  ))}
</div>
```

**Touch targets**:
- Minimum 44x44px (per constitution)
- Full-width cards on mobile (320px - padding = ~280px width, 60px+ height)
- Adequate spacing between cards (16px gap via Tailwind `gap-4`)

**Alternatives Considered**:
1. **Horizontal scrolling**: Poor discoverability, hard to scroll with one hand
2. **Dropdown menu**: Hides content, requires extra tap
3. **Floating action button**: Hard to scale beyond 3-5 challenges

**Recommendation**: Vertical stack (mobile) → grid (desktop). Aligns with existing homepage card layouts.

---

## 9. Performance Optimization

### Decision: Lazy Load Recent Challenges Component

**Rationale**:
- Feature is non-critical enhancement
- Lazy loading reduces initial bundle size
- Component only needed on homepage

**Pattern**:
```tsx
// app/page.tsx
import dynamic from 'next/dynamic'

const RecentChallenges = dynamic(() => import('@/components/recent-challenges'), {
  ssr: false, // Client-only component
  loading: () => <div className="h-32 animate-pulse bg-gray-200 rounded-lg" />,
})

export default function HomePage() {
  return (
    <main>
      {/* Hero section */}
      <RecentChallenges />
      {/* Rest of homepage */}
    </main>
  )
}
```

**Alternatives Considered**:
1. **No lazy loading**: Adds ~5-10KB to initial bundle
2. **Lazy load on scroll**: Adds complexity, component above fold
3. **Defer with setTimeout**: Hack, unpredictable timing

**Recommendation**: Use Next.js `dynamic()` with `ssr: false` for explicit client-side rendering and code splitting.

---

## 10. localStorage Key Naming Convention

### Decision: Use Namespaced Key `push-track:recentChallenges`

**Rationale**:
- Prevents collisions with other scripts on same origin
- Clear ownership (push-track app)
- Consistent with versioning strategy for future migrations

**Pattern**:
```typescript
const STORAGE_KEY = 'push-track:recentChallenges' as const
const STORAGE_VERSION = 1 as const

interface StorageData {
  version: number
  challenges: RecentChallenge[]
}

function saveToStorage(challenges: RecentChallenge[]): void {
  const data: StorageData = {
    version: STORAGE_VERSION,
    challenges,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function loadFromStorage(): RecentChallenge[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []

  const data = JSON.parse(raw) as StorageData

  if (data.version !== STORAGE_VERSION) {
    // Handle migration or clear
    console.warn('localStorage schema version mismatch, clearing')
    localStorage.removeItem(STORAGE_KEY)
    return []
  }

  return data.challenges
}
```

**Alternatives Considered**:
1. **Simple key `recentChallenges`**: Risk of collision with extensions/analytics
2. **Domain-prefixed `pushtrack.app:recentChallenges`**: Verbose
3. **No versioning**: Can't handle schema evolution

**Recommendation**: `push-track:recentChallenges` with version wrapper for future-proofing.

---

## Summary: Technology Choices

| Decision Area | Choice | Rationale |
|---------------|--------|-----------|
| **Component Type** | Client Component (`'use client'`) | localStorage requires browser APIs |
| **Hydration Safety** | `mounted` state guard | Prevents hydration mismatches |
| **Data Validation** | Zod schemas | Runtime type safety, aligns with codebase |
| **Sanitization** | Manual escape function | Zero dependencies, explicit |
| **Error Handling** | Try-catch with silent failure | Feature is enhancement, graceful degradation |
| **Truncation** | CSS `truncate` / `line-clamp` | Performant, accessible, responsive |
| **Challenge Validation** | None (best-effort) | Avoids API calls, maintains performance |
| **Sorting** | `lastVisited` timestamp descending | Reflects user behavior |
| **Layout** | Vertical stack → grid | Mobile-first, thumb-reachable |
| **Performance** | Dynamic import (`ssr: false`) | Code splitting, optional feature |
| **localStorage Key** | `push-track:recentChallenges` | Namespaced, versioned |

---

## Open Questions / Future Considerations

### 1. Schema Migration Strategy
**Current**: Clear localStorage on version mismatch
**Future**: Implement migration functions for backwards compatibility

### 2. Analytics / Usage Tracking
**Current**: No tracking
**Future**: Could track "quick access clicks" vs "email link clicks" to measure feature value

### 3. P2/P3 Features
- **P2**: Display all challenges (currently specified)
- **P3**: Manual remove button for stale challenges
- **Future**: Activity badges/pills for visual identification

### 4. Cross-Device Sync
**Current**: Device-local only
**Future**: Could sync via optional user account (requires authentication - major feature)

---

## References

- [MDN: Window.localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [Next.js: Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- [React: Hydration Errors](https://react.dev/reference/react-dom/client/hydrateRoot#hydrating-server-rendered-html)
- [Zod Documentation](https://zod.dev/)
- [OWASP: XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Tailwind CSS: Line Clamp](https://tailwindcss.com/docs/line-clamp)

---

**Phase 0 Complete** - All research decisions documented. Ready for Phase 1 (Data Model & Contracts).
