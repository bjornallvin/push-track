# Feature Specification: Late Entry Editing

**Feature Branch**: `003-late-entry-editing`
**Created**: 2025-10-23
**Status**: Draft
**Input**: User description: "Late entries. We need a way to enter data after the day is missed if I forget to enter it. Lets do this on the progress page. Maybe an edit button under each day."

## Clarifications

### Session 2025-10-24

- Q: What UI pattern should be used for the edit interface (modal, inline, sidebar, popover)? → A: Reuse the current way of entering today's entries
- Q: What metadata should be stored for late entries (timestamps, flags, edit history)? → A: Don't handle any history or special metadata
- Q: Should bulk editing of multiple days be included in this feature? → A: Defer bulk edit to a future feature (focus on individual day editing only)
- Q: How should users trigger editing a specific day (button, click bar, context menu, toggle mode)? → A: Edit button/icon visible on each day in the chart (always visible or on hover) with mobile-first UX
- Q: For multi-activity challenges, should partial updates be allowed or all activities required? → A: Use same behavior as current entry mode (allow partial updates)

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

### Out of Scope

- **Bulk editing multiple days at once**: Deferred to a future feature. This release focuses on individual day editing only.
- **Visual distinction of late vs on-time entries**: Not needed since late-entry metadata is not being tracked.

---

### Edge Cases

- What happens when user tries to edit a future day that hasn't arrived yet? (System should prevent editing future days)
- What happens when user enters invalid data (negative numbers, non-numeric values)? (System should validate and show error messages)
- What happens when user tries to edit a day from a completed challenge? (System should allow historical editing for record accuracy)
- What happens if the user has multiple activities and only updates some of them? (System allows partial updates; unchanged activities retain their existing values)
- What happens if network fails during save? (System should show error and retain unsaved changes)
- What happens when viewing progress on day 1 with no previous days? (Edit functionality should not appear or be disabled)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to edit activity data for any past day within the challenge period
- **FR-002**: System MUST display an edit button/icon for each individual day shown in the progress chart
- **FR-003**: Edit buttons MUST have adequate touch targets for mobile devices (minimum 44x44px)
- **FR-004**: Users MUST be able to add data to previously missed days (days with zero values)
- **FR-005**: Users MUST be able to update data for already-logged days to correct mistakes
- **FR-006**: System MUST validate that edited values are non-negative numbers appropriate for the activity unit
- **FR-007**: System MUST prevent users from editing days that haven't occurred yet (future days)
- **FR-008**: System MUST update the progress chart immediately after successful data save
- **FR-009**: Users MUST be able to cancel an edit operation without saving changes
- **FR-010**: System MUST display the correct activity unit labels when editing (reps, minutes, km, etc.)
- **FR-011**: System MUST support editing for all activities tracked in a multi-activity challenge
- **FR-012**: System MUST allow partial updates in multi-activity challenges (updating only some activities while preserving others)
- **FR-013**: System MUST show appropriate error messages when save operations fail

### Key Entities

- **Daily Log Entry**: Represents activity data for a specific date, including activity name and value (reps/minutes/km)
- **Challenge Day**: Represents a single day in the challenge period, including the date, day number (1-N), and whether it has passed, is current, or is in the future
- **Activity**: Represents a tracked activity with its name and unit type (inherited from existing data model)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can edit any past day's data in under 30 seconds from the progress page
- **SC-002**: Chart updates reflect saved changes immediately without requiring page refresh
- **SC-003**: 100% of valid edit operations persist correctly and survive page reload
- **SC-004**: System correctly prevents editing of future dates in 100% of attempts
- **SC-005**: Users receive clear, actionable feedback for invalid inputs within 1 second

## Assumptions

- Users access the progress page through the existing challenge dashboard navigation
- Edit interface reuses the same UI pattern currently used for entering today's entries
- UI follows mobile-first design principles with appropriate touch targets and responsive layout
- Multi-activity challenges require editing all activities for a given day in a single interface (not separate edits per activity)
- The system already has appropriate authentication/authorization to ensure users can only edit their own challenge data
