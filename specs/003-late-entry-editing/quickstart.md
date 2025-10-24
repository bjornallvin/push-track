# Quickstart: Late Entry Editing Implementation

**Feature**: Late Entry Editing
**Branch**: 003-late-entry-editing
**Date**: 2025-10-24

## Overview

This quickstart provides step-by-step guidance for implementing late entry editing. Follow the phases in order, building UI prototypes first (per Constitution Principle VI) before integrating with the backend.

---

## Prerequisites

Before starting implementation:

✅ Read [spec.md](./spec.md) - Feature requirements and acceptance criteria
✅ Read [research.md](./research.md) - Technical decisions and patterns
✅ Read [data-model.md](./data-model.md) - Data structures and validation
✅ Review [contracts/log-api.md](./contracts/log-api.md) - API contract details

**Estimated Time**: 6-8 hours total

---

## Phase 1: UI Prototype (Constitution Principle VI)

**Goal**: Build functional UI with static data before backend integration

**Time Estimate**: 2-3 hours

### Step 1.1: Create Edit Button Component

**File**: `components/challenge/edit-day-button.tsx`

**Purpose**: Clickable button for each day in the progress chart

**Static Implementation**:
```typescript
'use client'

import { Button } from '@/components/ui/button'
import { Edit2 } from 'lucide-react'
import Link from 'next/link'

interface EditDayButtonProps {
  challengeId: string
  date: string  // ISO format (YYYY-MM-DD)
  isEditable: boolean
  className?: string
}

export function EditDayButton({
  challengeId,
  date,
  isEditable,
  className
}: EditDayButtonProps) {
  if (!isEditable) return null

  return (
    <Link href={`/challenge/${challengeId}/edit?date=${date}`}>
      <Button
        variant="ghost"
        size="sm"
        className={className}
        aria-label={`Edit ${date}`}
      >
        <Edit2 className="h-4 w-4" />
      </Button>
    </Link>
  )
}
```

**Checklist**:
- [ ] Button has minimum 44x44px touch target (verify in browser)
- [ ] Edit2 icon from lucide-react displays correctly
- [ ] Button hidden when `isEditable=false`
- [ ] Link navigates to `/challenge/[id]/edit?date=YYYY-MM-DD`

---

### Step 1.2: Add Edit Buttons to Progress Chart

**File**: `components/challenge/progress-chart.tsx` (MODIFY)

**Changes**:
1. Import EditDayButton component
2. Generate date list for current challenge days
3. Render button below each day label

**Prototype Code** (add after chart rendering):
```typescript
import { EditDayButton } from './edit-day-button'
import { format, addDays } from 'date-fns'

// Inside ProgressChart component, after Chart.js rendering:

{/* Mock data for prototype - replace with real data in Phase 2 */}
<div className="mt-4 grid grid-cols-7 gap-2 md:grid-cols-10">
  {Array.from({ length: 10 }, (_, i) => {
    const mockDate = format(addDays(new Date(), -i), 'yyyy-MM-dd')
    const mockDayNumber = 10 - i

    return (
      <div key={i} className="flex flex-col items-center gap-1">
        <span className="text-xs text-muted-foreground">Day {mockDayNumber}</span>
        <EditDayButton
          challengeId="mock-challenge-id"
          date={mockDate}
          isEditable={true}  // All past days editable in prototype
          className="text-xs"
        />
      </div>
    )
  })}
</div>
```

**Checklist**:
- [ ] Edit buttons appear below each day in chart
- [ ] Buttons are evenly spaced and aligned
- [ ] Mobile viewport (320px): buttons remain touch-friendly
- [ ] Clicking button navigates to edit page

---

### Step 1.3: Create Edit Page with Static Data

**File**: `app/challenge/[id]/edit/page.tsx` (NEW)

**Purpose**: Edit page that reuses ActivityLogger with mock data

**Prototype Code**:
```typescript
import { ActivityLogger } from '@/components/challenge/activity-logger'
import { notFound } from 'next/navigation'

interface EditPageProps {
  params: { id: string }
  searchParams: { date?: string }
}

export default function EditPage({ params, searchParams }: EditPageProps) {
  const { id } = params
  const { date } = searchParams

  if (!date) {
    notFound()  // Date is required
  }

  // MOCK DATA - Replace in Phase 2
  const mockChallenge = {
    id,
    name: 'Mock Challenge',
    activities: ['Push-ups', 'Sit-ups'],
    activityUnits: {
      'Push-ups': 'reps' as const,
      'Sit-ups': 'reps' as const
    },
    startDate: '2025-10-01',
    duration: 30,
    status: 'active' as const
  }

  const mockExistingLogs = [
    { activity: 'Push-ups', reps: 50 },
    { activity: 'Sit-ups', reps: 30 }
  ]

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-2xl font-bold mb-2">Edit Activity Log</h1>
      <p className="text-muted-foreground mb-6">
        Editing data for {date}
      </p>

      <ActivityLogger
        challenge={mockChallenge}
        targetDate={date}  // NEW PROP - pass to ActivityLogger
        existingLogs={mockExistingLogs}  // Pre-fill with mock data
      />
    </div>
  )
}
```

**Checklist**:
- [ ] Page renders at `/challenge/[id]/edit?date=2025-10-23`
- [ ] Shows date being edited in heading
- [ ] ActivityLogger displays with mock activities
- [ ] Form pre-fills with mock existing values (50, 30)
- [ ] Cancel/save buttons visible (non-functional in prototype)

---

### Step 1.4: Modify ActivityLogger for Date Support

**File**: `components/challenge/activity-logger.tsx` (MODIFY)

**Changes**: Add optional props for edit mode

**Prototype Modifications**:
```typescript
interface ActivityLoggerProps {
  challenge: Challenge
  targetDate?: string         // NEW: ISO date for edit mode
  existingLogs?: LogEntry[]   // NEW: Pre-fill values for edit mode
}

export function ActivityLogger({
  challenge,
  targetDate,
  existingLogs
}: ActivityLoggerProps) {
  // Initialize state with existing logs if provided
  const [activityValues, setActivityValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}

    challenge.activities.forEach(activity => {
      const existing = existingLogs?.find(log => log.activity === activity)
      initial[activity] = existing?.reps ?? 0  // Use existing or default to 0
    })

    return initial
  })

  // Update heading text based on mode
  const heading = targetDate
    ? `Editing ${targetDate}`
    : 'Log Today\'s Activities'

  // Rest of component unchanged (increment/decrement logic, etc.)

  // Submit handler updated to include date (Phase 2)
  const handleSubmit = async () => {
    // Prototype: Just console.log for now
    console.log('Submit:', { activityValues, targetDate })
    alert('Prototype mode - no API call')
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">{heading}</h2>
      {/* Existing stepper UI */}
      {/* ... */}
    </div>
  )
}
```

**Checklist**:
- [ ] Form pre-fills with `existingLogs` values
- [ ] Heading changes to "Editing YYYY-MM-DD" when targetDate provided
- [ ] Increment/decrement buttons work correctly
- [ ] Submit button shows alert (prototype mode)
- [ ] Cancel button returns to progress page (add navigation)

---

### Step 1.5: Prototype Demo & Approval

**Demo Checklist**:
- [ ] Navigate to progress chart
- [ ] See edit buttons on each day (mobile viewport 375px)
- [ ] Click edit button → navigate to edit page
- [ ] See pre-filled form with mock data
- [ ] Change values using increment/decrement
- [ ] Click submit → see prototype alert
- [ ] Verify 44x44px touch targets on all buttons (use browser inspector)
- [ ] Test on multiple breakpoints (320px, 375px, 768px)

**Approval Gate**: Get stakeholder approval before proceeding to Phase 2

---

## Phase 2: Backend Integration

**Goal**: Connect UI prototype to real API and data

**Time Estimate**: 3-4 hours

### Step 2.1: Extend Zod Validation Schema

**File**: `lib/challenge/validation.ts` (MODIFY)

**Add Date Validation**:
```typescript
import { z } from 'zod'

// Existing schema
export const LogEntrySchema = z.object({
  activity: z.string().min(1).max(50),
  reps: z.number().int().nonnegative().max(10000)
})

// Extended schema with date support
export const LogRepsRequestSchema = z.object({
  logs: z.array(LogEntrySchema).min(1).max(5),
  date: z.string().datetime().optional()
}).refine(
  (data) => {
    if (!data.date) return true

    const targetDate = new Date(data.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    targetDate.setHours(0, 0, 0, 0)

    return targetDate <= today
  },
  { message: 'Cannot edit future dates' }
)
```

**Checklist**:
- [ ] Schema allows optional date field
- [ ] Future date validation works (write test case)
- [ ] Invalid date format rejected
- [ ] Existing code without date still validates

---

### Step 2.2: Update Repository Layer

**File**: `lib/challenge/repository.ts` (MODIFY)

**Modify `logReps` Method**:
```typescript
async logReps(
  challengeId: string,
  activity: string,
  reps: number,
  targetDate?: Date  // NEW: Optional target date
): Promise<void> {
  const logDate = targetDate ?? new Date()  // Default to today
  const dateKey = format(logDate, 'yyyy-MM-dd')

  // Check for existing log (edit mode allows overwrites)
  const existingLogs = await this.getLogs(challengeId)
  const existingLog = existingLogs.find(
    log => log.date === dateKey && log.activity === activity
  )

  const dailyLog: DailyLog = {
    date: dateKey,
    activity,
    reps
  }

  // If editing, remove old entry first
  if (existingLog) {
    await this.redis.zrem(
      `challenge:${challengeId}:logs`,
      JSON.stringify(existingLog)
    )
  }

  // Add new/updated entry
  await this.redis.zadd(
    `challenge:${challengeId}:logs`,
    logDate.getTime() / 1000,  // Unix timestamp as score
    JSON.stringify(dailyLog)
  )

  // Recalculate metrics (existing method, unchanged)
  await this.calculateAndCacheMetrics(challengeId, activity)
}
```

**Checklist**:
- [ ] Method accepts optional targetDate
- [ ] Defaults to today when omitted (backward compatible)
- [ ] Removes existing log before adding update
- [ ] Metrics recalculation triggered
- [ ] Redis operations atomic

---

### Step 2.3: Update API Route

**File**: `app/api/challenge/[id]/log/route.ts` (MODIFY)

**Add Date Parameter Support**:
```typescript
import { LogRepsRequestSchema } from '@/lib/challenge/validation'
import { format, startOfDay, isAfter, isBefore } from 'date-fns'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params

  // Parse and validate request
  const body = await request.json()
  const validation = LogRepsRequestSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: validation.error.message },
      { status: 400 }
    )
  }

  const { logs, date } = validation.data

  // Fetch challenge
  const challenge = await repository.getChallenge(id)
  if (!challenge) {
    return NextResponse.json(
      { error: 'NO_ACTIVE_CHALLENGE', message: 'Challenge not found' },
      { status: 404 }
    )
  }

  // Determine target date (default to today)
  const targetDate = date ? new Date(date) : new Date()
  const isEditMode = !!date

  // Additional date validation
  if (date) {
    const challengeStart = new Date(challenge.startDate)
    const today = startOfDay(new Date())
    const target = startOfDay(targetDate)

    if (isAfter(target, today)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Cannot edit future dates' },
        { status: 400 }
      )
    }

    if (isBefore(target, challengeStart)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Date before challenge start' },
        { status: 400 }
      )
    }
  }

  // Validate activities match challenge
  const requestActivities = logs.map(l => l.activity)
  const missingActivities = challenge.activities.filter(
    a => !requestActivities.includes(a)
  )

  if (missingActivities.length > 0) {
    return NextResponse.json(
      {
        error: 'MISSING_ACTIVITIES',
        message: `Missing activities: ${missingActivities.join(', ')}`
      },
      { status: 400 }
    )
  }

  // Check for already-logged (skip in edit mode)
  if (!isEditMode) {
    const todayLogs = await repository.getLogsForDate(id, format(targetDate, 'yyyy-MM-dd'))
    const alreadyLogged = logs.some(log =>
      todayLogs.some(existing => existing.activity === log.activity)
    )

    if (alreadyLogged) {
      return NextResponse.json(
        { error: 'ALREADY_LOGGED_TODAY', message: 'Already logged today' },
        { status: 409 }
      )
    }
  }

  // Log all activities
  for (const log of logs) {
    await repository.logReps(id, log.activity, log.reps, targetDate)
  }

  // Check completion status
  const updated = await repository.getChallenge(id)
  await repository.checkAndUpdateCompletion(id)

  // Fetch updated metrics
  const activityMetrics = await repository.getAllMetrics(id)

  return NextResponse.json({
    logs: logs.map(log => ({
      date: format(targetDate, 'yyyy-MM-dd'),
      activity: log.activity,
      reps: log.reps
    })),
    activityMetrics,
    challengeCompleted: updated?.status === 'completed'
  })
}
```

**Checklist**:
- [ ] Parses optional date parameter
- [ ] Validates date range (not future, within challenge)
- [ ] Skips duplicate check in edit mode
- [ ] Passes targetDate to repository.logReps
- [ ] Returns updated metrics in response
- [ ] Error responses match contract

---

### Step 2.4: Update ActivityLogger API Call

**File**: `components/challenge/activity-logger.tsx` (MODIFY)

**Replace Prototype Submit Handler**:
```typescript
const handleSubmit = async () => {
  setLoading(true)
  setError(null)

  try {
    const logs = challenge.activities.map(activity => ({
      activity,
      reps: activityValues[activity]
    }))

    const body: LogRepsRequest = {
      logs,
      ...(targetDate && { date: targetDate })  // Include date if editing
    }

    const response = await fetch(`/api/challenge/${challenge.id}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to save')
    }

    setSuccess(true)

    // Redirect after success
    setTimeout(() => {
      router.push(`/challenge/${challenge.id}/progress`)
      router.refresh()
    }, 1500)

  } catch (err) {
    setError(err instanceof Error ? err.message : 'Unknown error')
  } finally {
    setLoading(false)
  }
}
```

**Checklist**:
- [ ] Includes date in request body when targetDate provided
- [ ] Shows loading state during API call
- [ ] Displays error messages from API
- [ ] Redirects to progress page after success
- [ ] Calls router.refresh() to reload chart data

---

### Step 2.5: Update Edit Page with Real Data

**File**: `app/challenge/[id]/edit/page.tsx` (MODIFY)

**Replace Mock Data**:
```typescript
import { repository } from '@/lib/challenge/repository'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'

export default async function EditPage({ params, searchParams }: EditPageProps) {
  const { id } = params
  const { date } = searchParams

  if (!date) {
    notFound()
  }

  // Fetch real challenge data
  const challenge = await repository.getChallenge(id)
  if (!challenge) {
    notFound()
  }

  // Fetch existing logs for this date
  const allLogs = await repository.getLogs(id)
  const existingLogs = allLogs.filter(log => log.date === date)

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-2xl font-bold mb-2">Edit Activity Log</h1>
      <p className="text-muted-foreground mb-6">
        Editing data for {format(new Date(date), 'MMMM d, yyyy')}
      </p>

      <ActivityLogger
        challenge={challenge}
        targetDate={date}
        existingLogs={existingLogs}
      />
    </div>
  )
}
```

**Checklist**:
- [ ] Fetches real challenge from Redis
- [ ] Fetches real logs for target date
- [ ] Returns 404 if challenge not found
- [ ] Returns 404 if date parameter missing
- [ ] Form pre-fills with actual existing values

---

### Step 2.6: Update Progress Chart with Real Edit Buttons

**File**: `components/challenge/progress-chart.tsx` (MODIFY)

**Replace Mock Buttons with Real Logic**:
```typescript
import { format, addDays, startOfDay, isBefore, isSameDay } from 'date-fns'

// Inside ProgressChart component, derive dates from challenge:

const today = startOfDay(new Date())
const challengeStart = startOfDay(new Date(challenge.startDate))
const currentDay = Math.min(
  Math.ceil((today.getTime() - challengeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1,
  challenge.duration
)

{/* Render edit buttons for each day */}
<div className="mt-4 grid grid-cols-7 gap-2 md:grid-cols-10">
  {Array.from({ length: currentDay }, (_, i) => {
    const dayNumber = i + 1
    const dayDate = addDays(challengeStart, i)
    const dateStr = format(dayDate, 'yyyy-MM-dd')
    const isEditable = isBefore(dayDate, today) || isSameDay(dayDate, today)

    return (
      <div key={i} className="flex flex-col items-center gap-1">
        <span className="text-xs text-muted-foreground">Day {dayNumber}</span>
        <EditDayButton
          challengeId={challenge.id}
          date={dateStr}
          isEditable={isEditable}
          className="text-xs"
        />
      </div>
    )
  })}
</div>
```

**Checklist**:
- [ ] Buttons render for all days up to current day
- [ ] Future days have no edit button
- [ ] Date calculation matches challenge start date
- [ ] Clicking button navigates with correct date parameter
- [ ] Chart and buttons align correctly

---

## Phase 3: Testing & Validation

**Time Estimate**: 1-2 hours

### Test Scenarios

**Manual Testing Checklist**:

✅ **Happy Path**:
- [ ] Edit missed day (0 reps → 50 reps) → Chart updates (red → colored bar)
- [ ] Edit existing day (50 reps → 60 reps) → Chart updates with new value
- [ ] Multi-activity: Edit only one activity → Other activities unchanged
- [ ] Cancel edit → No changes saved, redirects to progress
- [ ] Chart re-renders immediately after save (no page reload needed)

✅ **Validation**:
- [ ] Try editing future day → Edit button not shown
- [ ] Enter negative reps → Validation error shown
- [ ] Enter > 10,000 reps → Validation error shown
- [ ] Leave activity empty → Can't submit (button disabled)

✅ **Edge Cases**:
- [ ] Edit day 1 with no previous days → Works correctly
- [ ] Edit completed challenge → Allows editing (per spec edge case)
- [ ] Set reps to 0 → Creates missed-day entry (red bar)
- [ ] Network error during save → Error message shown, data retained

✅ **Mobile (320px, 375px)**:
- [ ] Edit buttons meet 44x44px touch target
- [ ] Form fields large enough for thumb input
- [ ] No horizontal scroll required
- [ ] Buttons/text readable without zooming

✅ **Multi-Device**:
- [ ] iOS Safari 15+ (test on iPhone if available)
- [ ] Chrome Android 100+ (test on Android if available)
- [ ] Desktop Chrome/Safari/Firefox

---

## Phase 4: Final Polish

**Time Estimate**: 30 minutes

### Accessibility Verification

- [ ] Edit button has `aria-label` describing date
- [ ] Form fields have proper labels
- [ ] Error messages are announced to screen readers
- [ ] Keyboard navigation works (Tab through buttons)
- [ ] Focus indicators visible on all interactive elements

### Performance Check

- [ ] API response time < 500ms (check Network tab)
- [ ] Chart renders in < 1s after save
- [ ] No console errors or warnings
- [ ] TypeScript compiles with no errors (`npm run lint`)

### Final Constitution Re-check

- [ ] I. Mobile-First: 44x44px touch targets verified
- [ ] II. Simplicity: No unnecessary abstractions added
- [ ] III. Type Safety: No `any` types, Zod validation working
- [ ] IV. Progressive Enhancement: Server Components used appropriately
- [ ] V. Observability: Clear error messages, logs include context
- [ ] VI. UI-First: Prototype built and approved before backend integration

---

## Deployment Checklist

Before merging to main:

- [ ] All acceptance scenarios from spec.md pass
- [ ] Manual testing complete on mobile device
- [ ] No TypeScript errors (`npm run lint`)
- [ ] Constitution compliance verified
- [ ] Feature branch up to date with main
- [ ] Ready for pull request review

---

## Troubleshooting

### Issue: Edit buttons not appearing

**Check**:
1. `isEditable` prop calculation correct (past/current dates only)
2. Component imported correctly in progress-chart.tsx
3. Date format is ISO (YYYY-MM-DD)

### Issue: Form not pre-filling existing values

**Check**:
1. `existingLogs` prop passed to ActivityLogger
2. Logs fetched for correct date in edit page
3. Activity names match exactly (case-sensitive)

### Issue: API returns 400 "Cannot edit future dates"

**Check**:
1. Server and client time zones aligned
2. Date string format is YYYY-MM-DD
3. Date calculation uses `startOfDay` to strip time

### Issue: Chart not updating after edit

**Check**:
1. `router.refresh()` called after successful save
2. Progress page uses Server Component (not cached)
3. Redis data actually updated (check with redis-cli)

---

## Success Criteria

Feature is complete when:

✅ All acceptance scenarios from spec.md pass
✅ SC-001: Users edit past day in < 30 seconds
✅ SC-002: Chart updates without page refresh
✅ SC-003: 100% of edits persist and survive reload
✅ SC-004: Future dates cannot be edited
✅ SC-005: Error feedback shown within 1 second

---

## Next Steps

After this feature is complete:

1. Run `/speckit.tasks` to generate detailed task breakdown
2. Follow task execution in order
3. Create pull request when all tasks complete
4. Reference this quickstart during code review

---

## Support

Questions during implementation? Refer to:
- [spec.md](./spec.md) - Requirements and edge cases
- [research.md](./research.md) - Technical decisions
- [contracts/log-api.md](./contracts/log-api.md) - API details
- [data-model.md](./data-model.md) - Data structures

**Constitution**: `.specify/memory/constitution.md`
**CLAUDE.md**: Runtime development guidance
