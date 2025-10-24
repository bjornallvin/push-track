# Feature Specification: Late Entry Editing

**Feature Branch**: `003-late-entry-editing`
**Created**: 2025-10-23
**Status**: Draft
**Input**: User description: "Late entries. We need a way to enter data after the day is missed if I forget to enter it. Lets do this on the progress page. Maybe an edit button under each day."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Edit Previous Day Entry (Priority: P1)

As a user viewing my progress, I want to add or update activity data for past days that I missed or entered incorrectly, so I can maintain an accurate log of my challenge without losing progress.

**Why this priority**: This is the core feature that addresses the immediate need to correct missing or incorrect data. Without this, users lose motivation when they forget to log a day.

**Independent Test**: Can be fully tested by navigating to the progress page, selecting a previous day (whether missed or already logged), entering/updating activity values, and verifying the data persists and displays correctly in the chart.

**Acceptance Scenarios**:

1. **Given** I am viewing the progress page with missed days (red bars), **When** I click an edit button for a missed day, **Then** I see a form to enter activity data for that specific date
2. **Given** I am editing a missed day's entry, **When** I enter valid activity values and save, **Then** the day's bar changes from red to the activity color and displays the entered value
3. **Given** I am viewing the progress page with logged days, **When** I click an edit button for an already-logged day, **Then** I see the existing values pre-filled in the form
4. **Given** I am editing an existing day's entry, **When** I update the values and save, **Then** the chart updates to reflect the new values
5. **Given** I am editing a day's entry, **When** I cancel without saving, **Then** no changes are made to the existing data

---

### User Story 2 - Visual Distinction of Late Entries (Priority: P2)

As a user, I want to see which entries were logged late versus on-time, so I can track my adherence to the daily challenge schedule.

**Why this priority**: Provides additional value by helping users understand their logging habits, but not critical for basic data correction functionality.

**Independent Test**: Can be fully tested by making late entries and verifying they are visually distinguished from on-time entries in the chart (e.g., different border style, pattern, or indicator).

**Acceptance Scenarios**:

1. **Given** I have entries logged on-time and entries logged late, **When** I view the progress chart, **Then** late entries are visually distinguished (e.g., hatched pattern, different border)
2. **Given** I hover over a bar in the chart, **When** the tooltip appears, **Then** it shows whether the entry was logged on-time or late

---

### User Story 3 - Bulk Edit Multiple Days (Priority: P3)

As a user who has fallen behind on logging, I want to quickly enter data for multiple missed days at once, so I can catch up efficiently without repetitive clicking.

**Why this priority**: Nice-to-have optimization for users who fall significantly behind, but individual day editing (P1) already provides the core functionality.

**Independent Test**: Can be fully tested by selecting multiple missed days, entering values for each activity, and verifying all days update correctly in a single operation.

**Acceptance Scenarios**:

1. **Given** I have multiple missed days, **When** I activate bulk edit mode, **Then** I see a form showing all missed days with input fields for each activity
2. **Given** I am in bulk edit mode, **When** I enter values for multiple days and save, **Then** all specified days update simultaneously
3. **Given** I am in bulk edit mode, **When** I leave some days empty and save, **Then** only the days with values are updated

---

### Edge Cases

- What happens when user tries to edit a future day that hasn't arrived yet? (System should prevent editing future days)
- What happens when user enters invalid data (negative numbers, non-numeric values)? (System should validate and show error messages)
- What happens when user tries to edit a day from a completed challenge? (System should allow historical editing for record accuracy)
- What happens if the user has multiple activities and only updates some of them? (System should allow partial updates without affecting other activities)
- What happens if network fails during save? (System should show error and retain unsaved changes)
- What happens when viewing progress on day 1 with no previous days? (Edit functionality should not appear or be disabled)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to edit activity data for any past day within the challenge period
- **FR-002**: System MUST display an edit interface for each individual day shown in the progress chart
- **FR-003**: Users MUST be able to add data to previously missed days (days with zero values)
- **FR-004**: Users MUST be able to update data for already-logged days to correct mistakes
- **FR-005**: System MUST validate that edited values are non-negative numbers appropriate for the activity unit
- **FR-006**: System MUST prevent users from editing days that haven't occurred yet (future days)
- **FR-007**: System MUST persist edited data with metadata indicating the entry was created/modified after the original date
- **FR-008**: System MUST update the progress chart immediately after successful data save
- **FR-009**: Users MUST be able to cancel an edit operation without saving changes
- **FR-010**: System MUST display the correct activity unit labels when editing (reps, minutes, km, etc.)
- **FR-011**: System MUST support editing for all activities tracked in a multi-activity challenge
- **FR-012**: System MUST show appropriate error messages when save operations fail
- **FR-013**: System MUST preserve the original log timestamp while storing the late-entry timestamp separately

### Key Entities

- **Daily Log Entry**: Represents activity data for a specific date, including activity name, value (reps/minutes/km), original log timestamp, and late-entry metadata (whether it was logged late and when)
- **Challenge Day**: Represents a single day in the challenge period, including the date, day number (1-N), and whether it has passed, is current, or is in the future
- **Activity**: Represents a tracked activity with its name and unit type (inherited from existing data model)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can edit any past day's data in under 30 seconds from the progress page
- **SC-002**: Chart updates reflect saved changes immediately without requiring page refresh
- **SC-003**: 100% of valid edit operations persist correctly and survive page reload
- **SC-004**: System correctly prevents editing of future dates in 100% of attempts
- **SC-005**: Users receive clear, actionable feedback for invalid inputs within 1 second
- **SC-006**: Late-entry metadata is accurately stored for 100% of after-the-fact entries

## Assumptions

- Users access the progress page through the existing challenge dashboard navigation
- Edit interface appears inline with the chart or as a modal/dialog - specific UX pattern to be determined during planning
- The existing Redis-based storage can accommodate additional metadata fields for late entries
- Multi-activity challenges require editing all activities for a given day in a single interface (not separate edits per activity)
- Users understand that editing past entries doesn't change the original logging date for tracking purposes
- The system already has appropriate authentication/authorization to ensure users can only edit their own challenge data
