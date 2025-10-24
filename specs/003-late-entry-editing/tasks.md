# Tasks: Late Entry Editing

**Input**: Design documents from `/specs/003-late-entry-editing/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/log-api.md

**Tests**: Manual testing only (per constitution). No automated test tasks included.

**Organization**: Tasks organized by implementation phases, following UI-first development (Constitution Principle VI).

## Format: `- [ ] [ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1)
- Include exact file paths in descriptions

## Path Conventions
- Next.js 14 App Router: `app/`, `components/`, `lib/` at repository root
- Server components in `app/`, client components in `components/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and validation

- [ ] T001 Validate existing project structure matches plan.md requirements
- [ ] T002 [P] Verify lucide-react icons are available (Edit2 icon needed)
- [ ] T003 [P] Verify date-fns is available for date manipulation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core validation and type extensions that ALL user story tasks depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Extend LogEntry type in lib/challenge/types.ts to add LogRepsRequest interface with optional date field
- [ ] T005 Extend Zod validation schema in lib/challenge/validation.ts to add optional date field with future-date validation
- [ ] T006 Add ChallengeDay interface in lib/challenge/types.ts for edit button logic (derived entity, no storage)

**Checkpoint**: Type definitions and validation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Edit Previous Day Entry (Priority: P1) 🎯 MVP

**Goal**: Enable users to add or update activity data for past days from the progress page, maintaining an accurate challenge log

**Independent Test**: Navigate to progress page → click edit button for any past day → enter/update activity values → save → verify data persists and chart updates correctly

### UI Prototype First (Constitution Principle VI)

**Static UI with mock data - build these BEFORE backend integration**

- [ ] T007 [P] [US1] Create EditDayButton component in components/challenge/edit-day-button.tsx with static link and 44x44px touch target
- [ ] T008 [US1] Add EditDayButton rendering logic to ProgressChart component in components/challenge/progress-chart.tsx with mock date array (10 days)
- [ ] T009 [US1] Create edit page at app/challenge/[id]/edit/page.tsx with mock challenge data and ActivityLogger integration
- [ ] T010 [US1] Extend ActivityLogger component in components/challenge/activity-logger.tsx to accept targetDate and existingLogs props for pre-filling

**Checkpoint**: Functional UI prototype with static data - ready for stakeholder demo and approval

### Backend Integration

**Connect UI to real API and data**

- [ ] T011 [US1] Update repository.logReps method in lib/challenge/repository.ts to accept optional targetDate parameter
- [ ] T012 [US1] Extend API route in app/api/challenge/[id]/log/route.ts to parse optional date parameter and validate date range
- [ ] T013 [US1] Update API route to skip duplicate-check and completion-check when in edit mode (date parameter present)
- [ ] T014 [US1] Update ActivityLogger submit handler in components/challenge/activity-logger.tsx to include date in API request when targetDate provided
- [ ] T015 [US1] Replace mock data in edit page app/challenge/[id]/edit/page.tsx with real challenge and log fetching
- [ ] T016 [US1] Update ProgressChart in components/challenge/progress-chart.tsx to derive real dates from challenge and render edit buttons with isEditable logic

**Checkpoint**: User Story 1 is fully functional - users can edit any past day's data and see chart updates

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Final refinements across all components

- [ ] T017 [P] Verify accessibility: aria-labels on edit buttons, keyboard navigation, focus indicators
- [ ] T018 [P] Verify mobile touch targets meet 44x44px minimum (use browser inspector at 320px, 375px viewports)
- [ ] T019 Verify API response time < 500ms for edit operations (use Network tab)
- [ ] T020 Verify chart updates immediately after save without page reload
- [ ] T021 Run manual test scenarios from specs/003-late-entry-editing/quickstart.md Phase 3 checklist
- [ ] T022 Final constitution compliance check against all 6 principles

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user story work
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
  - UI Prototype section must complete BEFORE Backend Integration section (Constitution Principle VI)
  - Within UI Prototype: T007 must complete before T008 (component needed for rendering)
  - Within Backend Integration: Sequential execution recommended (each task modifies existing code)
- **Polish (Phase 4)**: Depends on User Story 1 completion

### User Story Dependencies

- **User Story 1 (P1)**: Only user story for this feature - no inter-story dependencies

### Within User Story 1

**UI Prototype Section**:
- T007 (EditDayButton component) can start after Phase 2
- T008 (Add to ProgressChart) depends on T007 completing
- T009 (Edit page) and T010 (ActivityLogger extension) can run in parallel after T007

**Backend Integration Section** (after UI approval):
- T011 (Repository) and T012 (API route core) can run in parallel
- T013 (API route edit mode logic) depends on T012
- T014 (ActivityLogger API call) depends on T010, T012, T013
- T015 (Edit page real data) depends on T009, T011
- T016 (ProgressChart real dates) depends on T008, T011

### Parallel Opportunities

- **Phase 1**: T002 and T003 can run in parallel (dependency verification)
- **Phase 3 UI Prototype**: T009 and T010 can run in parallel (different components)
- **Phase 3 Backend**: T011 and T012 can run in parallel (different layers)
- **Phase 4**: T017, T018, T019, T020 can run in parallel (different verification aspects)

---

## Parallel Example: User Story 1

### UI Prototype Phase
```bash
# After T007 completes, launch these together:
Task: "Create edit page at app/challenge/[id]/edit/page.tsx"
Task: "Extend ActivityLogger component in components/challenge/activity-logger.tsx"
```

### Backend Integration Phase
```bash
# After Phase 2 completes, launch these together:
Task: "Update repository.logReps method in lib/challenge/repository.ts"
Task: "Extend API route in app/api/challenge/[id]/log/route.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

This feature consists of a single user story, so MVP = full feature:

1. Complete Phase 1: Setup (~15 minutes)
2. Complete Phase 2: Foundational (~30 minutes)
3. Complete Phase 3 UI Prototype section (~2-3 hours)
4. **STOP for DEMO**: Get stakeholder approval on UI prototype
5. Complete Phase 3 Backend Integration section (~3-4 hours)
6. **STOP and VALIDATE**: Test all acceptance scenarios from spec.md
7. Complete Phase 4: Polish (~30 minutes)
8. Final validation and ready for PR

**Total Estimated Time**: 6-8 hours (per quickstart.md)

### Incremental Delivery

1. Setup + Foundational → Type system ready (30 min)
2. UI Prototype → Interactive mockup demo ready (3 hours)
3. Backend Integration → Full feature functional (7 hours cumulative)
4. Polish → Production ready (8 hours cumulative)

---

## Acceptance Criteria (from spec.md)

Feature complete when all 5 acceptance scenarios pass:

1. ✅ Click edit button on missed day → see form for that date
2. ✅ Enter valid activity values on missed day → chart bar changes from red to colored
3. ✅ Click edit button on logged day → see existing values pre-filled
4. ✅ Update existing day's values → chart reflects new values
5. ✅ Cancel edit without saving → no changes made

Additional validation:

6. ✅ SC-001: Users can edit past day in < 30 seconds
7. ✅ SC-002: Chart updates without page refresh
8. ✅ SC-003: 100% of edits persist and survive reload
9. ✅ SC-004: Future dates cannot be edited (button hidden)
10. ✅ SC-005: Error feedback shown within 1 second

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [US1] label = User Story 1 task (only user story in this feature)
- UI-first approach: Build prototype with mock data before backend integration
- Constitution Principle VI compliance: Prototype → Demo → Backend → Polish
- All edit buttons must meet 44x44px minimum touch target (FR-003)
- Date format: ISO 8601 (YYYY-MM-DD) throughout
- Backward compatibility: Existing log functionality unchanged (date parameter optional)
- No test automation: Manual testing per constitution
- Commit after each completed task or logical group
