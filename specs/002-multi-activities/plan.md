# Implementation Plan: Multi-Activity Challenge Tracking

**Feature**: 002-multi-activities
**Date**: 2025-10-18
**Status**: Draft

---

## Implementation Strategy

This feature extends the existing pushup challenge tracker to support multiple activity types. The implementation follows a layered approach, starting from data layer up to UI components.

---

## Phase 1: Data Layer Updates

### 1.1 Update Type Definitions

**File**: `lib/challenge/types.ts`

**Changes**:
- Add `activities: string[]` to `Challenge` interface
- Add `activity: string` to `DailyLog` interface
- Rename `DailyLog.pushups` to `DailyLog.reps`
- Rename `LogPushupsRequest` to `LogRepsRequest`
- Add `activity` parameter to log request
- Update all type exports and response types

**Migration Consideration**: Keep backward compatibility by supporting both old and new field names during migration period.

### 1.2 Update Validation Schemas

**File**: `lib/challenge/validation.ts`

**Changes**:
- Add validation for `activities` array (min 1, max 5 items)
- Add validation for activity name format (1-30 chars, alphanumeric + spaces + hyphens)
- Update `DailyLogSchema` to include `activity` field
- Rename `pushups` to `reps` in validation
- Add `LogRepsRequestSchema` with activity parameter
- Add case-insensitive uniqueness check for activities

**New Schemas**:
```typescript
const ActivityNameSchema = z.string()
  .min(1).max(30)
  .regex(/^[a-zA-Z0-9\s\-]+$/, "Activity name must contain only letters, numbers, spaces, and hyphens")

const ActivitiesArraySchema = z.array(ActivityNameSchema)
  .min(1, "At least one activity required")
  .max(5, "Maximum 5 activities allowed")
  .refine((activities) => {
    const lowerCased = activities.map(a => a.toLowerCase())
    return new Set(lowerCased).size === lowerCased.length
  }, "Activity names must be unique")
```

### 1.3 Update Repository Methods

**File**: `lib/challenge/repository.ts`

**Changes**:
- Update `createChallenge()` to accept and store `activities` array
- Update `logPushups()` → `logReps()` to accept `activity` parameter
- Update `hasLoggedToday()` → `hasLoggedToday(activity)` to check specific activity
- Add `hasLoggedAllActivitiesToday()` to check if all activities logged
- Update `getAllLogs()` to return logs with activity field
- Add `getLogsForActivity(challengeId, activity)` method
- Update `getMetrics()` → `getMetricsForActivity(challengeId, activity)`
- Add `getAllActivityMetrics(challengeId)` to get metrics for all activities
- Update `calculateAndCacheMetrics()` to work per activity
- Add migration logic in `getChallenge()` to handle old challenges

**New Methods**:
```typescript
async getLogsForActivity(challengeId: string, activity: string): Promise<DailyLog[]>
async hasLoggedAllActivitiesToday(challengeId: string): Promise<boolean>
async getMetricsForActivity(challengeId: string, activity: string): Promise<ActivityMetrics>
async getAllActivityMetrics(challengeId: string): Promise<Map<string, ActivityMetrics>>
```

### 1.4 Update Calculator

**File**: `lib/challenge/calculator.ts`

**Changes**:
- Update `calculateMetrics()` to accept `activity` parameter
- Filter logs by activity before calculating metrics
- Ensure streak calculation is per-activity
- Ensure personal best is per-activity

**Signature Change**:
```typescript
// Old
calculateMetrics(challenge: Challenge, logs: DailyLog[]): ProgressMetrics

// New
calculateMetrics(challenge: Challenge, logs: DailyLog[], activity: string): ActivityMetrics
```

---

## Phase 2: API Layer Updates

### 2.1 Create Challenge API

**File**: `app/api/challenge/route.ts`

**Changes**:
- Update request schema to include `activities` array
- Validate activities using new schema
- Pass activities to repository `createChallenge()`
- Update response to include activities
- Update email sending to mention selected activities

### 2.2 Log Entry API

**File**: `app/api/challenge/[id]/log/route.ts`

**Changes**:
- Accept array of `{activity, reps}` objects instead of single `pushups` value
- Validate that all challenge activities are included in request
- Call `logReps()` for each activity
- Return metrics for all activities in response
- Check if challenge is completed after logging

**New Request Body**:
```typescript
{
  logs: [
    { activity: "Push-ups", reps: 25 },
    { activity: "Pull-ups", reps: 10 },
    { activity: "Abs", reps: 30 }
  ]
}
```

### 2.3 Get Challenge API

**File**: `app/api/challenge/[id]/route.ts`

**Changes**:
- Return activities array in response
- Return per-activity metrics in response
- Return per-activity `hasLoggedToday` status
- Return per-activity yesterday counts for pre-filling

**Updated Response**:
```typescript
{
  id: string
  duration: number
  startDate: string
  status: string
  currentDay: number
  activities: string[]
  activityMetrics: {
    [activity: string]: {
      streak: number
      personalBest: number
      totalReps: number
      hasLoggedToday: boolean
      yesterdayCount: number | null
    }
  }
}
```

---

## Phase 3: UI Components - Activity Selection

### 3.1 Activity Selector Component

**New File**: `components/challenge/activity-selector.tsx`

**Purpose**: Allow users to select preset activities and add custom ones during challenge creation

**Features**:
- Checkbox list for preset activities (Push-ups, Pull-ups, Abs, Squats)
- Input field + "Add" button for custom activities
- Display selected activities with remove button
- Show count (X/5 activities selected)
- Prevent adding more than 5 activities
- Validate custom activity names in real-time
- Mobile-friendly touch targets (44x44px minimum)

**Preset Activities**:
```typescript
const PRESET_ACTIVITIES = [
  "Push-ups",
  "Pull-ups",
  "Abs",
  "Squats"
]
```

**Component Structure**:
```tsx
<ActivitySelector
  selectedActivities={selectedActivities}
  onChange={setSelectedActivities}
  maxActivities={5}
/>
```

### 3.2 Update Create Form

**File**: `components/challenge/create-form.tsx`

**Changes**:
- Import and use `ActivitySelector` component
- Update form state to include `activities` array
- Update validation to require at least 1 activity
- Update submit handler to send activities
- Update UI to show activity selection step

---

## Phase 4: UI Components - Multi-Activity Logging

### 4.1 Multi-Activity Logger Component

**New File**: `components/challenge/activity-logger.tsx`

**Purpose**: Log reps for all selected activities in a single form

**Features**:
- Display all activities vertically
- Stepper control (plus/minus buttons) for each activity
- Pre-fill with yesterday's values per activity
- Large submit button at bottom
- Show validation errors per activity
- Mobile-optimized layout

**Component Structure**:
```tsx
<ActivityLogger
  activities={["Push-ups", "Pull-ups", "Abs"]}
  yesterdayValues={{ "Push-ups": 25, "Pull-ups": 10, "Abs": 30 }}
  onSubmit={(logs) => handleSubmit(logs)}
/>
```

**State Management**:
```typescript
// Form state
const [activityReps, setActivityReps] = useState<Record<string, number>>({
  "Push-ups": 25,
  "Pull-ups": 10,
  "Abs": 30
})

// Validation
const allActivitiesLogged = activities.every(
  activity => activityReps[activity] !== undefined
)
```

### 4.2 Update Log Stepper

**File**: `components/challenge/log-stepper.tsx`

**Changes**:
- Rename component to `MultiActivityLogStepper` or make generic
- Accept activities list and pre-filled values
- Remove single-activity assumptions
- Use new `ActivityLogger` component
- Update success message to mention all logged activities

---

## Phase 5: UI Components - Metrics Display

### 5.1 Per-Activity Metrics Card

**New File**: `components/challenge/activity-metrics.tsx`

**Purpose**: Display metrics for a single activity

**Features**:
- Activity name header with icon/color
- Streak display
- Personal best display
- Total reps display
- Completion rate for this activity
- Match existing colorful gradient design

**Component Structure**:
```tsx
<ActivityMetrics
  activity="Push-ups"
  metrics={{
    streak: 5,
    personalBest: 30,
    totalReps: 125,
    completionRate: 100
  }}
/>
```

### 5.2 Multi-Activity Metrics Grid

**File**: `components/challenge/metrics-display.tsx`

**Changes**:
- Update to render multiple `ActivityMetrics` components
- Display in grid or vertical stack
- Maintain colorful design with different gradient per activity
- Add activity differentiation (icons or colors)

**Color Assignments**:
```typescript
const ACTIVITY_COLORS = {
  "Push-ups": "purple-pink",
  "Pull-ups": "blue-cyan",
  "Abs": "orange-yellow",
  "Squats": "emerald-green",
  "default": "indigo-violet"
}
```

---

## Phase 6: UI Components - Charts

### 6.1 Per-Activity Chart Component

**New File**: `components/challenge/activity-chart.tsx`

**Purpose**: Render a single vertical bar chart for one activity

**Features**:
- Activity name as chart title
- Vertical bars (same as existing chart)
- X-axis: Days
- Y-axis: Reps
- Different color per activity (matching metrics)
- Mobile responsive

**Component Structure**:
```tsx
<ActivityChart
  activity="Push-ups"
  logs={pushupLogs}
  color="purple"
/>
```

### 6.2 Multi-Activity Charts Container

**File**: `components/challenge/progress-chart.tsx`

**Changes**:
- Update to render multiple `ActivityChart` components
- Stack charts vertically
- Add spacing between charts
- Maintain mobile-friendly sizing
- Consider lazy loading for performance with 5 charts

---

## Phase 7: Email Templates

### 7.1 Update Email Content

**File**: `lib/email.ts`

**Changes**:
- Update challenge creation email to list selected activities
- Update "forgot link" email to mention activities
- Add pluralization logic (1 activity vs multiple activities)

**Example Text Changes**:
```html
<!-- Old -->
<p>You've just started your <strong>${duration}-day pushup challenge</strong>!</p>

<!-- New (single activity) -->
<p>You've just started your <strong>${duration}-day ${activities[0]} challenge</strong>!</p>

<!-- New (multiple activities) -->
<p>You've just started your <strong>${duration}-day challenge</strong> tracking ${activities.length} activities:</p>
<ul>
  ${activities.map(a => `<li>${a}</li>`).join('')}
</ul>
```

---

## Phase 8: Migration & Backward Compatibility

### 8.1 Automatic Migration Logic

**Location**: `lib/challenge/repository.ts` → `getChallenge()` method

**Logic**:
```typescript
async getChallenge(challengeId: string): Promise<Challenge | null> {
  const data = await redis.hGetAll(`challenge:${challengeId}`)

  if (!data || Object.keys(data).length === 0) {
    return null
  }

  // Migration: Add activities field if missing
  let activities: string[]
  if (data.activities) {
    activities = JSON.parse(data.activities)
  } else {
    // Old challenge - default to Push-ups
    activities = ["Push-ups"]
    await redis.hSet(`challenge:${challengeId}`, {
      activities: JSON.stringify(activities)
    })
  }

  return {
    // ... other fields
    activities
  }
}
```

### 8.2 Log Migration

**Location**: `lib/challenge/repository.ts` → `getAllLogs()` method

**Logic**:
```typescript
async getAllLogs(challengeId: string): Promise<DailyLog[]> {
  const results = await redis.zRange(`challenge:${challengeId}:logs`, 0, -1)

  return results.map((item) => {
    const log = JSON.parse(item as string)

    // Migration: Add activity and reps fields if missing
    if (!log.activity) {
      log.activity = "Push-ups"
    }
    if (log.pushups !== undefined && log.reps === undefined) {
      log.reps = log.pushups
    }

    return log as DailyLog
  })
}
```

---

## Phase 9: Testing & Validation

### 9.1 Unit Tests

**New Tests**:
- Activity name validation (length, characters, uniqueness)
- Activities array validation (min/max)
- Per-activity metrics calculation
- Per-activity streak calculation
- Migration logic for old challenges

### 9.2 Integration Tests

**Test Scenarios**:
- Create challenge with 1 activity
- Create challenge with 5 activities
- Create challenge with preset + custom activities
- Log all activities for multiple days
- Verify independent streaks break correctly
- Verify charts render correctly for each activity
- Verify migration of existing challenges

### 9.3 Manual Testing Checklist

- [ ] Create single-activity challenge
- [ ] Create multi-activity challenge (2-5 activities)
- [ ] Add custom activity with valid name
- [ ] Attempt to add invalid activity names (too long, special chars)
- [ ] Attempt to add 6th activity (should prevent)
- [ ] Log all activities on day 1
- [ ] Log all activities on subsequent days
- [ ] Log 0 for one activity, non-zero for others (verify independent streaks)
- [ ] View separate charts for each activity
- [ ] View per-activity metrics
- [ ] Test on mobile device
- [ ] Load existing single-activity challenge (verify migration)
- [ ] Receive email with activity list

---

## Deployment Strategy

### Phase 1: Backend Preparation
1. Deploy data layer changes (types, validation, repository)
2. Deploy API updates
3. Verify migration works for existing challenges

### Phase 2: UI Rollout
1. Deploy activity selection on create form
2. Deploy multi-activity logger
3. Deploy per-activity metrics and charts

### Phase 3: Communication
1. Update `.env.example` if needed
2. Update CLAUDE.md project guidelines
3. Add email template changes

---

## Rollback Plan

If issues arise, the feature can be rolled back by:

1. Reverting UI components (users see old single-activity interface)
2. Keeping migration logic active (preserves data)
3. New challenges default to `activities: ["Push-ups"]` in backend
4. Old challenges continue to work normally

**Data Preservation**: All changes maintain backward compatibility. Rollback does not require data migration.

---

## Performance Considerations

### Database Impact
- **Logs**: 5x more entries for 5-activity challenge (manageable with TTL)
- **Metrics**: 5 separate hashes instead of 1 (minimal impact)
- **Queries**: Filtering by activity happens in application (acceptable for small datasets)

### UI Impact
- **Charts**: Rendering 5 charts instead of 1 (consider lazy loading)
- **Forms**: Stepper controls for 5 activities vs 1 (still within mobile UX best practices)

### Optimization Opportunities
- Cache activity metrics in component state to reduce recalculation
- Lazy load charts (render as user scrolls)
- Debounce stepper button clicks for smooth UX

---

## Success Metrics

**Functional Success**:
- ✅ Users can create challenges with 1-5 activities
- ✅ Users can log all activities daily
- ✅ Per-activity streaks calculate independently
- ✅ Per-activity charts render correctly
- ✅ Existing challenges migrate seamlessly

**Performance Success**:
- Page load time remains under 2s on mobile
- Logging form interaction feels responsive (< 100ms)
- Charts render within 1s on mobile

**User Experience Success**:
- Touch targets remain 44x44px minimum
- Forms remain intuitive with multiple activities
- Visual distinction between activities is clear
