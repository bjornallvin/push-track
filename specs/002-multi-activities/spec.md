# Feature Specification: Multi-Activity Challenge Tracking

**Feature Branch**: `002-multi-activities`
**Created**: 2025-10-18
**Status**: Draft
**Parent Feature**: 001-pushup-challenge-app
**Input**: User description: "I want to be able to choose the activity that I track max tries in. Push up is one, Pull ups and Abs is another. Maybe even a custom activity. When creating a new challenge I want to select which activities I want to track in my challenge."

## Clarifications

### Session 2025-10-18

- Q: Should there be a minimum/maximum number of activities users can select? → A: 1-5 activities (min 1, max 5)
- Q: Should users be required to log ALL selected activities each day? → A: Yes, users must log a number (including 0) for each selected activity every day
- Q: How should the progress chart display multiple activities? → A: Separate chart per activity (stacked vertically on the page)
- Q: How should the streak be calculated when tracking multiple activities? → A: Per-activity streaks (each activity has its own independent streak counter)
- Q: Should there be preset activity options or custom names? → A: Preset + Custom (offer common presets with option to add custom activities)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Select Multiple Activities (Priority: P1)

A user wants to track their progress across multiple different exercises in a single challenge, such as Push-ups, Pull-ups, and Abs, to maintain a well-rounded fitness routine.

**Why this priority**: This is the core enhancement that enables users to track multiple activities instead of being limited to pushups only. It's the foundational change that makes the app more versatile and valuable.

**Independent Test**: Can be fully tested by creating a challenge and selecting 2-5 different activities from presets and custom options, then verifying they are saved correctly.

**Acceptance Scenarios**:

1. **Given** I am creating a new challenge, **When** I view the activity selection screen, **Then** I should see preset options (Push-ups, Pull-ups, Abs, Squats) and an option to add custom activities
2. **Given** I am selecting activities for my challenge, **When** I select or add activities, **Then** the system should allow me to select between 1 and 5 activities total
3. **Given** I have selected 5 activities, **When** I try to add another activity, **Then** the system should prevent me and display a message that the maximum is 5 activities
4. **Given** I am adding a custom activity, **When** I enter a custom name, **Then** the system should accept alphanumeric names with reasonable length limits (1-30 characters)
5. **Given** I have selected my activities, **When** I create the challenge, **Then** all selected activities should be saved and displayed in my challenge dashboard

---

### User Story 2 - Log Multiple Activities Daily (Priority: P2)

A user wants to log their performance for each selected activity every day to track progress across all their exercises.

**Why this priority**: This is the daily engagement loop that makes multi-activity tracking functional. Without it, the activity selection has no purpose.

**Independent Test**: Can be tested by creating a multi-activity challenge (P1), then logging reps for each activity for a day and verifying all are saved correctly.

**Acceptance Scenarios**:

1. **Given** I have a challenge with multiple activities, **When** I navigate to log my daily workout, **Then** I should see a separate input for each selected activity
2. **Given** I am logging my daily workout, **When** I enter reps for each activity (including 0 for activities I didn't do), **Then** the system should save all entries for today's date
3. **Given** I have not completed logging all activities, **When** I try to submit, **Then** the system should require me to enter a value for every activity before submitting
4. **Given** I have already logged all activities today, **When** I return to the app, **Then** the system should show my logged values and prevent duplicate entries
5. **Given** I am adjusting counts for each activity, **When** I use the plus/minus buttons, **Then** each activity should have its own independent stepper control
6. **Given** I logged yesterday, **When** I open the logging screen today, **Then** each activity input should pre-fill with yesterday's count for that specific activity

---

### User Story 3 - View Per-Activity Progress (Priority: P3)

A user wants to see separate progress charts for each activity to understand their performance trends independently for each exercise type.

**Why this priority**: Visual feedback for each activity helps users identify which exercises they're improving at and which need more focus. Essential for multi-activity motivation.

**Independent Test**: Can be tested by creating a multi-activity challenge (P1), logging multiple days (P2), then viewing the dashboard and verifying each activity has its own chart.

**Acceptance Scenarios**:

1. **Given** I have logged multiple days across multiple activities, **When** I view my challenge dashboard, **Then** I should see a separate vertical bar chart for each activity stacked vertically
2. **Given** I am viewing the per-activity charts, **When** I look at each chart, **Then** each chart should be clearly labeled with the activity name
3. **Given** I have 3 activities in my challenge, **When** I scroll through the dashboard, **Then** I should see 3 distinct charts, one for each activity
4. **Given** I am viewing a specific activity's chart, **When** I look at the bars, **Then** I should see the progression of reps over time for just that activity
5. **Given** I have missed logging an activity for a day (logged 0), **When** I view the chart, **Then** zero-rep days should be visually distinct but still show as logged

---

### User Story 4 - Track Per-Activity Metrics (Priority: P2)

A user wants to see streak, personal best, and other metrics calculated separately for each activity to understand their performance independently.

**Why this priority**: Per-activity metrics provide meaningful insights into individual exercise progress. Critical for maintaining motivation across different activity types.

**Independent Test**: Can be tested by logging different patterns for different activities (e.g., consistent push-ups but inconsistent pull-ups) and verifying streaks are calculated independently.

**Acceptance Scenarios**:

1. **Given** I have a multi-activity challenge, **When** I view the dashboard, **Then** each activity should display its own streak, personal best, and total reps
2. **Given** I have logged push-ups daily but missed a day of pull-ups, **When** I view metrics, **Then** the push-up streak should continue while the pull-up streak resets to 0
3. **Given** I have different personal bests for different activities, **When** I view metrics, **Then** each activity should show its own highest single-day count
4. **Given** I am viewing activity metrics, **When** I look at total reps, **Then** each activity should show its cumulative count independently
5. **Given** I logged 0 reps for an activity on a day, **When** I view that activity's streak, **Then** the streak should be broken (reset to 0) for that activity only

---

### Edge Cases

- What happens when a user tries to add a custom activity with the same name as a preset? System should allow it but treat it as selecting the preset (case-insensitive matching).
- What happens when a user tries to add a custom activity with an empty name or special characters? System should validate and require 1-30 alphanumeric characters (spaces and hyphens allowed).
- What happens when a user logs 0 for all activities on a day? All activity streaks break, but it counts as a logged day for completion rate calculation.
- How does the system handle very long custom activity names in the UI? Activity names are limited to 30 characters and truncated with ellipsis in compact views.
- What happens to existing single-activity challenges (from 001 feature)? They are automatically migrated to store "Push-ups" as a single-item activity array. Existing logs are associated with "Push-ups" activity.
- Can users change the activities in their challenge after creation? No, activities are locked once a challenge starts (same as duration). Users must abandon and create a new challenge to change activities.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to select between 1 and 5 activities when creating a new challenge
- **FR-002**: System MUST provide preset activity options: "Push-ups", "Pull-ups", "Abs", "Squats"
- **FR-003**: System MUST allow users to add custom activity names (1-30 alphanumeric characters, spaces and hyphens allowed)
- **FR-004**: System MUST prevent users from adding more than 5 activities total (presets + custom combined)
- **FR-005**: System MUST prevent users from creating a challenge with zero activities selected
- **FR-006**: System MUST store the list of selected activities with each challenge
- **FR-007**: System MUST prevent modification of activities once a challenge has started
- **FR-008**: System MUST require users to log a rep count (including 0) for every selected activity each day
- **FR-009**: System MUST store each activity log entry with the activity name, date, rep count, and timestamp
- **FR-010**: System MUST prevent duplicate logs for the same activity on the same day
- **FR-011**: System MUST calculate streak independently for each activity (consecutive days with non-zero reps)
- **FR-012**: System MUST calculate personal best independently for each activity (highest single-day count)
- **FR-013**: System MUST calculate total reps independently for each activity (cumulative sum)
- **FR-014**: System MUST display a separate vertical bar chart for each activity on the dashboard
- **FR-015**: System MUST clearly label each chart with the corresponding activity name
- **FR-016**: System MUST stack activity charts vertically on the dashboard for easy comparison
- **FR-017**: System MUST display per-activity metrics (streak, personal best, total reps) for each activity
- **FR-018**: System MUST pre-fill each activity's logging input with that activity's value from the previous day
- **FR-019**: System MUST provide independent stepper controls (plus/minus buttons) for each activity during logging
- **FR-020**: System MUST treat logging 0 reps as breaking the streak for that specific activity only
- **FR-021**: System MUST validate custom activity names (alphanumeric, spaces, hyphens, 1-30 characters)
- **FR-022**: System MUST be case-insensitive when matching custom activity names to presets
- **FR-023**: System MUST migrate existing single-activity challenges to multi-activity format (with "Push-ups" as single activity)
- **FR-024**: System MUST update email templates to mention the selected activities
- **FR-025**: System MUST maintain mobile-first design with touch-friendly controls for multi-activity logging

### Key Entities

- **Challenge**: Updated to include `activities: string[]` (1-5 activity names). Represents a user's commitment to track multiple exercises over a specified period.
- **Daily Log Entry**: Updated to include `activity: string` and renamed field from `pushups` to `reps`. Each log entry now represents one activity's reps for one day.
- **Activity Metrics**: New calculated values per activity including: activity name, streak, personal best, total reps
- **Preset Activities**: Predefined list of common exercises: Push-ups, Pull-ups, Abs, Squats

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can successfully create challenges with 1-5 activities combining presets and custom names
- **SC-002**: Users can log all selected activities in a single daily logging session
- **SC-003**: Each activity displays its own independent chart, streak, and metrics on the dashboard
- **SC-004**: Per-activity streaks calculate correctly and independently (one activity streak can continue while another breaks)
- **SC-005**: Custom activity validation prevents empty names, overly long names, and enforces character restrictions
- **SC-006**: Mobile interface remains intuitive and touch-friendly even with 5 activities
- **SC-007**: Existing single-activity challenges continue to work correctly after migration

## Assumptions

- Users understand that logging 0 reps is different from not logging (0 breaks streak but counts toward completion rate)
- Users are okay with logging ALL selected activities every day (no partial logging)
- Reasonable activity name length (30 characters) is sufficient for custom activities
- Preset activity names cover the most common use cases (users can add others as custom)
- Per-activity visualization (separate charts) is more valuable than combined views
- Users accessing a challenge with multiple activities will have sufficient screen height to scroll through all charts on mobile
- The 5-activity maximum is sufficient for most users' needs
- Activities are relatively equivalent in nature (rep-based exercises like pushups, pullups, squats, situps)
- Migration of existing challenges can happen automatically without user intervention
