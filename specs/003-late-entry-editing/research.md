# Research: Late Entry Editing

**Feature**: Late Entry Editing
**Branch**: 003-late-entry-editing
**Date**: 2025-10-24

## Overview

This document captures research findings and decisions for implementing late entry editing functionality in Push-Track.

## Technical Decisions

### 1. UI Pattern for Edit Interface

**Decision**: Reuse existing ActivityLogger component with date parameter

**Rationale**:
- Clarification session confirmed: "Reuse the current way of entering today's entries"
- ActivityLogger already handles multi-activity challenges correctly
- Maintains consistency with existing UX patterns
- Reduces development time and testing surface area
- Users already familiar with the interface

**Alternatives Considered**:
- **Inline editing within chart**: Would require custom form controls in Chart.js canvas, significantly more complex
- **Modal overlay**: More complex state management, doesn't match existing patterns
- **Sidebar panel**: Less mobile-friendly, doesn't match current app navigation

**Implementation Approach**:
- Add optional `targetDate` prop to ActivityLogger component
- Create new page route: `/challenge/[id]/edit?date=YYYY-MM-DD`
- Pre-fill form values from existing logs for that date (if any)
- API route accepts optional date parameter (defaults to today if omitted)

---

### 2. Edit Button Placement & Interaction

**Decision**: Individual edit button/icon on each day bar in progress chart with 44x44px touch target

**Rationale**:
- Clarification session confirmed: "Edit button/icon visible on each day... with mobile-first UX"
- Spec requirement FR-003: "Edit buttons MUST have adequate touch targets (minimum 44x44px)"
- Explicit affordance - users know exactly which day they're editing
- Mobile-friendly: always visible (not hover-only) for touch devices

**Alternatives Considered**:
- **Click bar directly**: Less discoverable, accidental edits risk
- **Context menu (right-click)**: Not mobile-friendly
- **Single "Edit Mode" toggle**: Doesn't match spec clarification for per-day buttons

**Implementation Approach**:
- Add button below each day label in progress chart
- Use lucide-react `Edit2` or `Pencil` icon (existing dependency)
- Button component from shadcn/ui with minimum 44x44px sizing
- Disabled state for future days (prevent editing)
- Link to `/challenge/[id]/edit?date=YYYY-MM-DD`

---

### 3. Date Parameter Handling

**Decision**: Use ISO date format (YYYY-MM-DD) in query string and API

**Rationale**:
- Standard format, no ambiguity
- Existing codebase uses ISO dates in Redis storage
- URL-friendly, easy to bookmark/share
- TypeScript Date constructor natively parses ISO dates

**Alternatives Considered**:
- **Unix timestamp**: Less human-readable in URLs
- **Relative days (e.g., "day=5")**: Requires additional calculation, less clear

**Implementation Approach**:
- Query param: `?date=2025-10-23`
- API endpoint: `/api/challenge/[id]/log?date=2025-10-23`
- Validation: Zod schema ensures valid ISO date format
- Date range validation: Must be <= today and >= challenge start date

---

### 4. Data Storage Strategy

**Decision**: No additional metadata storage (no late-entry flags/timestamps)

**Rationale**:
- Clarification session confirmed: "Don't handle any history or special metadata"
- Simplifies implementation (Principle II: Simplicity Over Features)
- Existing Redis structure supports date-keyed logs without modification
- No user requirement for late vs on-time distinction

**Alternatives Considered**:
- **Store late-entry timestamp**: Rejected per clarification
- **Boolean `isLateEntry` flag**: Rejected per clarification
- **Separate Redis key for late entries**: Unnecessary complexity

**Implementation Approach**:
- Reuse existing `challenge:{id}:logs` sorted set
- Update or create log entry for specified date
- Existing metrics calculation (`calculator.ts`) works unchanged
- Chart rendering logic unchanged (no visual distinction needed)

---

### 5. API Route Modification Strategy

**Decision**: Extend existing `/api/challenge/[id]/log` POST route with optional date parameter

**Rationale**:
- Reuses existing validation logic (LogRepsRequestSchema)
- Maintains backward compatibility (date defaults to today)
- Single endpoint for both current-day and historical logging
- Simpler authentication/authorization (already implemented)

**Alternatives Considered**:
- **New endpoint `/api/challenge/[id]/log/[date]`**: More RESTful but requires duplicate logic
- **Separate `/api/challenge/[id]/edit` endpoint**: Unnecessary duplication

**Implementation Approach**:
```typescript
// Extend existing schema
const LogRepsRequestSchema = z.object({
  logs: z.array(LogEntrySchema),
  date: z.string().datetime().optional() // ISO date, defaults to today
})

// Validation additions:
// - Date must be <= today
// - Date must be >= challenge start date
// - No editing future days
```

---

### 6. Chart Re-rendering Strategy

**Decision**: Use Next.js `router.refresh()` to reload server data after edit

**Rationale**:
- Existing ActivityLogger already uses `router.refresh()`
- Server Components automatically re-fetch data
- No additional client-state management needed
- Ensures chart shows latest data from Redis

**Alternatives Considered**:
- **Client-side state update**: More complex, potential sync issues with Redis
- **Full page reload**: Worse UX, loses scroll position

**Implementation Approach**:
- After successful edit API response, call `router.refresh()`
- Progress chart re-renders with updated data
- Redirect to `/challenge/[id]/progress` after save

---

### 7. Partial Update Handling

**Decision**: Allow partial updates for multi-activity challenges

**Rationale**:
- Clarification session confirmed: "Use same behavior as current entry mode (allow partial updates)"
- Current API already supports this (validates all activities present)
- User can edit just one activity without affecting others

**Implementation Approach**:
- API validates that updated activities match challenge activities
- Repository layer updates only specified activities in Redis
- Metrics recalculation handles partial updates correctly

---

## Best Practices Applied

### Next.js 14 App Router Patterns
- **Server Components**: Progress page remains Server Component
- **Client Components**: Edit button uses "use client" for onClick handler
- **Route organization**: `/challenge/[id]/edit/page.tsx` follows App Router conventions
- **Data fetching**: Use server-side fetch in page components

### TypeScript + Zod Validation
- Extend existing schemas rather than create new ones
- Use `.optional()` for backward-compatible date parameter
- Validate date ranges at schema level (refinements)

### shadcn/ui Component Patterns
- Use Button component with proper size variants
- Maintain consistent spacing (gaps, padding)
- Use existing color system (no custom colors)

### Redis Operation Best Practices
- Use same sorted set structure (`challenge:{id}:logs`)
- Maintain atomic operations (check-then-set)
- Leverage existing `calculateAndCacheMetrics()` after updates

---

## Open Questions (Resolved)

All technical uncertainties have been resolved through:
1. Clarification session with stakeholder (5 questions answered)
2. Codebase analysis of existing patterns
3. Constitution compliance verification

No blocking research items remain.

---

## Dependencies & Integration Points

### Existing Components to Reuse
- `components/challenge/activity-logger.tsx` - Main form component
- `components/challenge/progress-chart.tsx` - Chart display (modify for edit buttons)
- `lib/challenge/repository.ts` - Data access layer (extend for date param)
- `lib/challenge/calculator.ts` - Metrics calculation (no changes needed)

### External Dependencies (No New Additions)
- React Hook Form + Zod - Already in use
- Chart.js 4.x - Already in use
- lucide-react - Already in use for icons
- shadcn/ui Button - Already in use

### Redis Schema (No Changes)
```
challenge:{id}              # Hash with challenge metadata
challenge:{id}:logs         # Sorted set (score = Unix timestamp of date)
challenge:{id}:metrics:{activity}  # Cached metrics per activity
```

---

## Performance Considerations

### Expected Impact
- **API latency**: +10-20ms for date validation (negligible)
- **Chart rendering**: No change (data structure identical)
- **Redis operations**: Same as current logging (1 read + 1 write per activity)

### Optimization Opportunities (Not Required for V1)
- Batch edit endpoint for multiple days (deferred to future feature)
- Client-side chart update without server round-trip (conflicts with progressive enhancement principle)

---

## Security & Validation

### Date Validation Rules
1. Date format: ISO 8601 (YYYY-MM-DD)
2. Date must be <= today (prevent future editing)
3. Date must be >= challenge start date
4. Date must be <= min(today, challenge start + duration)

### Authorization (Existing)
- URL-based authentication already prevents cross-challenge editing
- No additional authorization logic needed

### Input Validation (Extending Existing)
- Reuse LogRepsRequestSchema
- Add date parameter with Zod datetime validator
- Maintain existing non-negative number validation for reps

---

## Summary

All technical decisions align with:
- **Constitution Principle II (Simplicity)**: Reuse existing components, no new abstractions
- **Constitution Principle VI (UI-First)**: Will build prototype with static data first
- **Spec Clarifications**: All 5 clarification answers incorporated
- **Existing Patterns**: Follows Next.js App Router, shadcn/ui, and Redis conventions

No blocking issues identified. Ready to proceed to Phase 1 (Design & Contracts).
