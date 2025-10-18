# Implementation Tasks: Multi-Activity Challenge Tracking

**Feature**: 002-multi-activities
**Date**: 2025-10-18
**Status**: Draft

---

## Task Breakdown

### ✅ = Completed | ⏳ = In Progress | ⬜ = Not Started

---

## Phase 1: Data Layer (Foundation)

### Task 1.1: Update Type Definitions
**File**: `lib/challenge/types.ts`
**Estimated Time**: 30 minutes
**Status**: ⬜

**Subtasks**:
- [ ] Add `activities: string[]` field to `Challenge` interface
- [ ] Add `activity: string` field to `DailyLog` interface
- [ ] Rename `DailyLog.pushups` to `DailyLog.reps`
- [ ] Update `CreateChallengeRequest` to include `activities: string[]`
- [ ] Rename `LogPushupsRequest` to `LogRepsRequest`
- [ ] Add `activity: string` field to `LogRepsRequest`
- [ ] Create new `ActivityMetrics` interface with per-activity fields
- [ ] Update API response types to include activities and per-activity metrics

**Acceptance Criteria**:
- TypeScript compilation succeeds
- All interfaces properly exported
- JSDoc comments updated to reflect multi-activity support

---

### Task 1.2: Update Validation Schemas
**File**: `lib/challenge/validation.ts`
**Estimated Time**: 45 minutes
**Status**: ⬜

**Subtasks**:
- [ ] Create `ActivityNameSchema` (1-30 chars, alphanumeric + spaces + hyphens)
- [ ] Create `ActivitiesArraySchema` (min 1, max 5, unique case-insensitive)
- [ ] Add `activities` validation to `ChallengeSchema`
- [ ] Update `DailyLogSchema` to include `activity` field
- [ ] Rename `pushups` to `reps` in `DailyLogSchema`
- [ ] Create `LogRepsRequestSchema` with activity and reps fields
- [ ] Update `CreateChallengeRequestSchema` to include activities array
- [ ] Export new validation types

**Acceptance Criteria**:
- Zod validation accepts valid activity names
- Zod validation rejects invalid activity names (too long, special chars)
- Zod validation enforces 1-5 activity limit
- Zod validation enforces case-insensitive uniqueness

**Test Cases**:
```typescript
// Valid
["Push-ups", "Pull-ups", "Abs"]
["Custom Activity", "Another One"]

// Invalid
[] // Too few
["A", "B", "C", "D", "E", "F"] // Too many
["Push-ups", "PUSH-UPS"] // Duplicate (case-insensitive)
["Invalid@Activity"] // Special characters
```

---

### Task 1.3: Update Repository - Challenge Methods
**File**: `lib/challenge/repository.ts`
**Estimated Time**: 1 hour
**Status**: ⬜

**Subtasks**:
- [ ] Update `createChallenge()` to accept `activities: string[]` parameter
- [ ] Store activities as JSON string in Redis hash
- [ ] Update `getChallenge()` to parse activities from JSON
- [ ] Add migration logic in `getChallenge()` to default missing activities to ["Push-ups"]
- [ ] Update challenge creation to initialize metrics hash per activity

**Acceptance Criteria**:
- New challenges store activities array correctly
- Old challenges auto-migrate to ["Push-ups"] on first load
- Activities array is properly parsed from Redis JSON

---

### Task 1.4: Update Repository - Log Methods
**File**: `lib/challenge/repository.ts`
**Estimated Time**: 1.5 hours
**Status**: ⬜

**Subtasks**:
- [ ] Rename `logPushups()` to `logReps()`
- [ ] Add `activity: string` parameter to `logReps()`
- [ ] Update `logReps()` to store activity field in log
- [ ] Update `hasLoggedToday()` to accept `activity` parameter
- [ ] Create `hasLoggedAllActivitiesToday(challengeId)` method
- [ ] Update `getAllLogs()` to add migration logic (set activity="Push-ups" if missing, reps=pushups if missing)
- [ ] Create `getLogsForActivity(challengeId, activity)` method
- [ ] Update `getYesterdayLog()` to accept activity parameter

**Acceptance Criteria**:
- Can log reps for specific activity
- Can query logs for specific activity
- Old logs auto-migrate on retrieval
- Can check if all activities logged today

**New Method Signatures**:
```typescript
async logReps(challengeId: string, activity: string, reps: number): Promise<DailyLog>
async hasLoggedToday(challengeId: string, activity: string): Promise<boolean>
async hasLoggedAllActivitiesToday(challengeId: string): Promise<boolean>
async getLogsForActivity(challengeId: string, activity: string): Promise<DailyLog[]>
async getYesterdayLog(challengeId: string, activity: string): Promise<DailyLog | null>
```

---

### Task 1.5: Update Repository - Metrics Methods
**File**: `lib/challenge/repository.ts`
**Estimated Time**: 1 hour
**Status**: ⬜

**Subtasks**:
- [ ] Rename `getMetrics()` to `getMetricsForActivity()`
- [ ] Add `activity: string` parameter to `getMetricsForActivity()`
- [ ] Update Redis key to `challenge:{id}:metrics:{activity}`
- [ ] Create `getAllActivityMetrics(challengeId)` method that returns Map<string, ActivityMetrics>
- [ ] Update `calculateAndCacheMetrics()` to accept activity parameter
- [ ] Update metric caching to use per-activity keys

**Acceptance Criteria**:
- Metrics are stored and retrieved per activity
- Can get metrics for all activities in one call
- Metrics are cached correctly per activity

**New Method Signatures**:
```typescript
async getMetricsForActivity(challengeId: string, activity: string): Promise<ActivityMetrics>
async getAllActivityMetrics(challengeId: string): Promise<Map<string, ActivityMetrics>>
async calculateAndCacheMetrics(challengeId: string, activity: string): Promise<ActivityMetrics>
```

---

### Task 1.6: Update Calculator
**File**: `lib/challenge/calculator.ts`
**Estimated Time**: 45 minutes
**Status**: ⬜

**Subtasks**:
- [ ] Add `activity: string` parameter to `calculateMetrics()`
- [ ] Filter logs by activity before calculations
- [ ] Ensure streak calculation only considers logs for the specific activity
- [ ] Ensure personal best only considers logs for the specific activity
- [ ] Ensure total reps only sums logs for the specific activity
- [ ] Return `ActivityMetrics` instead of `ProgressMetrics`

**Acceptance Criteria**:
- Metrics calculated independently per activity
- Streak only counts consecutive days for that activity
- Personal best is max reps for that activity only

---

## Phase 2: API Layer

### Task 2.1: Update Create Challenge API
**File**: `app/api/challenge/route.ts`
**Estimated Time**: 45 minutes
**Status**: ⬜

**Subtasks**:
- [ ] Update request validation to expect `activities: string[]`
- [ ] Validate activities using `ActivitiesArraySchema`
- [ ] Pass activities to `createChallenge()`
- [ ] Update response to include activities array
- [ ] Update email sending to pass activities to email template

**Acceptance Criteria**:
- API accepts and validates activities array
- Challenge is created with activities
- Email mentions selected activities

---

### Task 2.2: Update Log Entry API
**File**: `app/api/challenge/[id]/log/route.ts`
**Estimated Time**: 1 hour
**Status**: ⬜

**Subtasks**:
- [ ] Update request schema to accept array of `{activity, reps}` objects
- [ ] Validate that all challenge activities are included
- [ ] Loop through activities and call `logReps()` for each
- [ ] Calculate metrics for all activities after logging
- [ ] Return per-activity metrics in response
- [ ] Check challenge completion status

**New Request Body Format**:
```typescript
{
  logs: [
    { activity: "Push-ups", reps: 25 },
    { activity: "Pull-ups", reps: 10 }
  ]
}
```

**Acceptance Criteria**:
- Accepts and validates multi-activity logs
- All activities are saved correctly
- Metrics returned for all activities
- Rejects if not all activities logged

---

### Task 2.3: Update Get Challenge API
**File**: `app/api/challenge/[id]/route.ts`
**Estimated Time**: 1 hour
**Status**: ⬜

**Subtasks**:
- [ ] Include `activities` array in response
- [ ] Get metrics for all activities using `getAllActivityMetrics()`
- [ ] For each activity, check `hasLoggedToday()`
- [ ] For each activity, get yesterday's count for pre-filling
- [ ] Structure response as per-activity data

**New Response Format**:
```typescript
{
  id: string
  duration: number
  startDate: string
  status: string
  currentDay: number
  activities: string[]
  activityMetrics: {
    "Push-ups": {
      streak: 5,
      personalBest: 30,
      totalReps: 125,
      hasLoggedToday: true,
      yesterdayCount: 28
    },
    "Pull-ups": { /* ... */ }
  }
}
```

**Acceptance Criteria**:
- Returns all activities
- Returns per-activity metrics
- Returns per-activity logging status
- Returns per-activity yesterday counts

---

## Phase 3: UI - Activity Selection

### Task 3.1: Create Activity Selector Component
**New File**: `components/challenge/activity-selector.tsx`
**Estimated Time**: 2 hours
**Status**: ⬜

**Subtasks**:
- [ ] Create component scaffolding with TypeScript interface
- [ ] Render preset activities as checkboxes (Push-ups, Pull-ups, Abs, Squats)
- [ ] Add custom activity input field
- [ ] Add "Add Custom" button
- [ ] Display selected activities as chips with remove button
- [ ] Show count "X/5 activities selected"
- [ ] Disable checkboxes/add button when 5 activities selected
- [ ] Validate custom activity name on input (real-time feedback)
- [ ] Ensure all touch targets are 44x44px minimum
- [ ] Add colorful gradient styling matching app theme

**Component Props**:
```typescript
interface ActivitySelectorProps {
  selectedActivities: string[]
  onChange: (activities: string[]) => void
  maxActivities?: number
}
```

**Acceptance Criteria**:
- Can select preset activities
- Can add custom activities
- Cannot exceed 5 activities
- Invalid custom names show error
- Selected activities can be removed
- Mobile-friendly touch targets

---

### Task 3.2: Update Create Challenge Form
**File**: `components/challenge/create-form.tsx`
**Estimated Time**: 1 hour
**Status**: ⬜

**Subtasks**:
- [ ] Import `ActivitySelector` component
- [ ] Add `activities` to form state
- [ ] Add `ActivitySelector` to form UI (before duration field)
- [ ] Update form validation to require at least 1 activity
- [ ] Update submit handler to include activities in request
- [ ] Update success handling
- [ ] Update error handling for activity validation

**Acceptance Criteria**:
- Activity selector appears on create form
- Form validates activities before submission
- Activities are sent to API correctly
- Error messages show for invalid activity selection

---

## Phase 4: UI - Multi-Activity Logging

### Task 4.1: Create Activity Logger Component
**New File**: `components/challenge/activity-logger.tsx`
**Estimated Time**: 2.5 hours
**Status**: ⬜

**Subtasks**:
- [ ] Create component scaffolding
- [ ] Render all activities as separate sections
- [ ] Add stepper control (plus/minus buttons) for each activity
- [ ] Pre-fill with yesterday's values per activity
- [ ] Add large submit button at bottom
- [ ] Add validation to ensure all activities have values
- [ ] Show success/error states
- [ ] Style with colorful gradients per activity
- [ ] Ensure 44x44px touch targets for all buttons
- [ ] Add loading state during submission

**Component Props**:
```typescript
interface ActivityLoggerProps {
  activities: string[]
  yesterdayValues: Record<string, number>
  onSubmit: (logs: {activity: string, reps: number}[]) => Promise<void>
}
```

**Acceptance Criteria**:
- All activities shown with independent steppers
- Yesterday's values pre-fill correctly
- Cannot submit until all activities have values
- Submission sends all activities to API
- Mobile-optimized layout

---

### Task 4.2: Update Log Stepper Page
**File**: `components/challenge/log-stepper.tsx` or create new file
**Estimated Time**: 1 hour
**Status**: ⬜

**Subtasks**:
- [ ] Update to use `ActivityLogger` component
- [ ] Pass activities from challenge data
- [ ] Pass yesterday values per activity
- [ ] Update success message to show all logged activities
- [ ] Update API call to send multi-activity format
- [ ] Handle multi-activity response

**Acceptance Criteria**:
- Multi-activity logging works end-to-end
- Success message mentions all activities
- Redirects to dashboard after logging

---

## Phase 5: UI - Metrics Display

### Task 5.1: Create Per-Activity Metrics Component
**New File**: `components/challenge/activity-metrics.tsx`
**Estimated Time**: 1.5 hours
**Status**: ⬜

**Subtasks**:
- [ ] Create component scaffolding
- [ ] Display activity name as header
- [ ] Display streak with icon
- [ ] Display personal best with icon
- [ ] Display total reps with icon
- [ ] Apply colorful gradient per activity
- [ ] Match existing card design
- [ ] Make mobile responsive

**Component Props**:
```typescript
interface ActivityMetricsProps {
  activity: string
  metrics: {
    streak: number
    personalBest: number
    totalReps: number
    completionRate: number
  }
  color?: string
}
```

**Acceptance Criteria**:
- Displays all per-activity metrics
- Visually distinct from other activities (color/gradient)
- Matches existing colorful design
- Mobile responsive

---

### Task 5.2: Update Metrics Display Container
**File**: `components/challenge/metrics-display.tsx`
**Estimated Time**: 1 hour
**Status**: ⬜

**Subtasks**:
- [ ] Update to render multiple `ActivityMetrics` components
- [ ] Loop through activities and render card for each
- [ ] Assign different gradient colors per activity
- [ ] Maintain grid/stack layout
- [ ] Update props to accept per-activity metrics

**Color Assignment Logic**:
```typescript
const ACTIVITY_COLORS = [
  "purple-pink", "blue-cyan", "orange-yellow",
  "emerald-green", "indigo-violet"
]
```

**Acceptance Criteria**:
- All activities show metrics
- Each activity has unique color
- Layout works on mobile
- Scrolling is smooth

---

## Phase 6: UI - Charts

### Task 6.1: Create Per-Activity Chart Component
**New File**: `components/challenge/activity-chart.tsx`
**Estimated Time**: 2 hours
**Status**: ⬜

**Subtasks**:
- [ ] Create component based on existing chart
- [ ] Accept activity name and filtered logs
- [ ] Render Chart.js bar chart
- [ ] Set title to activity name
- [ ] Apply color based on activity
- [ ] Make mobile responsive
- [ ] Handle edge cases (no logs, all zeros)

**Component Props**:
```typescript
interface ActivityChartProps {
  activity: string
  logs: DailyLog[]
  color: string
  duration: number
}
```

**Acceptance Criteria**:
- Chart renders correctly for activity logs
- Title shows activity name
- Color matches activity
- Mobile responsive

---

### Task 6.2: Update Progress Chart Container
**File**: `components/challenge/progress-chart.tsx`
**Estimated Time**: 1.5 hours
**Status**: ⬜

**Subtasks**:
- [ ] Update to render multiple `ActivityChart` components
- [ ] Filter logs per activity
- [ ] Stack charts vertically with spacing
- [ ] Pass appropriate colors per activity
- [ ] Consider lazy loading for performance
- [ ] Update props to accept activities and all logs

**Acceptance Criteria**:
- All activity charts render
- Charts stacked vertically
- Different colors per chart
- Performance is acceptable with 5 charts

---

## Phase 7: Email & Communication

### Task 7.1: Update Email Templates
**File**: `lib/email.ts`
**Estimated Time**: 45 minutes
**Status**: ⬜

**Subtasks**:
- [ ] Update `sendChallengeEmail()` to accept activities array
- [ ] Update new challenge email template to list activities
- [ ] Update forgot link email template to mention activities
- [ ] Add pluralization logic (1 activity vs multiple)
- [ ] Test email rendering

**Email Content Updates**:
```html
<!-- Single activity -->
<p>Your ${duration}-day ${activities[0]} challenge has started!</p>

<!-- Multiple activities -->
<p>Your ${duration}-day challenge has started! You're tracking:</p>
<ul>
  ${activities.map(a => `<li>${a}</li>`).join('')}
</ul>
```

**Acceptance Criteria**:
- Emails mention selected activities
- Single-activity email reads naturally
- Multi-activity email lists all activities
- Styling matches existing emails

---

## Phase 8: Testing & QA

### Task 8.1: Write Unit Tests
**Estimated Time**: 2 hours
**Status**: ⬜

**Test Coverage**:
- [ ] Activity name validation (valid/invalid cases)
- [ ] Activities array validation (count limits, uniqueness)
- [ ] Per-activity metrics calculation
- [ ] Per-activity streak calculation
- [ ] Migration logic (old challenges)
- [ ] Log filtering by activity

**Test File Locations**:
- `lib/challenge/__tests__/validation.test.ts`
- `lib/challenge/__tests__/calculator.test.ts`
- `lib/challenge/__tests__/repository.test.ts`

---

### Task 8.2: Integration Testing
**Estimated Time**: 1.5 hours
**Status**: ⬜

**Test Scenarios**:
- [ ] Create challenge with 1 activity → Success
- [ ] Create challenge with 5 activities → Success
- [ ] Create challenge with 6 activities → Fail
- [ ] Create challenge with invalid activity name → Fail
- [ ] Log all activities → Success
- [ ] Log partial activities → Fail
- [ ] Verify independent streaks
- [ ] Verify migration of old challenge

---

### Task 8.3: Manual Testing
**Estimated Time**: 2 hours
**Status**: ⬜

**Checklist**:
- [ ] Create single-activity challenge (preset)
- [ ] Create multi-activity challenge (presets + custom)
- [ ] Log all activities on multiple days
- [ ] Log 0 for one activity (verify streak breaks for that activity only)
- [ ] View dashboard with multiple charts
- [ ] View per-activity metrics
- [ ] Test on mobile device (iPhone and Android)
- [ ] Test touch targets (all ≥44x44px)
- [ ] Load existing single-activity challenge (verify migration)
- [ ] Receive and check email

---

## Phase 9: Documentation & Deployment

### Task 9.1: Update Project Documentation
**Estimated Time**: 30 minutes
**Status**: ⬜

**Files to Update**:
- [ ] Update `CLAUDE.md` with multi-activity feature notes
- [ ] Update `.env.example` if any new env vars needed
- [ ] Update README if it exists

---

### Task 9.2: Build & Deploy
**Estimated Time**: 1 hour
**Status**: ⬜

**Deployment Steps**:
- [ ] Run `npm run build` to verify production build
- [ ] Fix any build errors or TypeScript errors
- [ ] Test production build locally
- [ ] Commit all changes to feature branch
- [ ] Create PR to main branch
- [ ] Review and merge PR
- [ ] Deploy to Vercel
- [ ] Verify production deployment

---

## Summary

**Total Estimated Time**: ~25 hours

**Phase Breakdown**:
- Phase 1 (Data Layer): ~6 hours
- Phase 2 (API Layer): ~2.75 hours
- Phase 3 (Activity Selection UI): ~3 hours
- Phase 4 (Logging UI): ~3.5 hours
- Phase 5 (Metrics UI): ~2.5 hours
- Phase 6 (Charts UI): ~3.5 hours
- Phase 7 (Email): ~0.75 hours
- Phase 8 (Testing): ~5.5 hours
- Phase 9 (Documentation & Deployment): ~1.5 hours

**Critical Path**:
1. Data layer changes (Phase 1) must be completed first
2. API layer (Phase 2) depends on Phase 1
3. UI components (Phases 3-6) can be developed in parallel after Phase 2
4. Email (Phase 7) can be done anytime after Phase 1
5. Testing (Phase 8) happens after all implementation
6. Deployment (Phase 9) is final step

**Risk Areas**:
- Migration of existing challenges (test thoroughly)
- Performance with 5 charts rendering (consider lazy loading)
- Mobile UX with multiple activity steppers (ensure good spacing)
- Validation edge cases (duplicate names, special characters)
