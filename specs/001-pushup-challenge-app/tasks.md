# Tasks: Pushup Challenge Tracker

**Input**: Design documents from `/specs/001-pushup-challenge-app/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api-routes.md ✅

**Tests**: Not included (not requested in specification)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize Next.js 14+ project with TypeScript and App Router in repository root
- [ ] T002 [P] Install core dependencies: react, next, typescript, tailwindcss, redis, zod, react-hook-form
- [ ] T003 [P] Install chart dependencies: chart.js, react-chartjs-2
- [ ] T004 [P] Configure TypeScript strict mode in tsconfig.json
- [ ] T005 [P] Configure Tailwind CSS in tailwind.config.ts with mobile-first breakpoints (320px, 375px, 768px, 1024px)
- [ ] T006 [P] Create Next.js configuration in next.config.js
- [ ] T007 [P] Create .env.example file with REDIS_URL placeholder
- [ ] T008 [P] Configure ESLint in .eslintrc.json
- [ ] T009 Create project directory structure: app/, components/, lib/, public/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T010 Create Redis client singleton in lib/redis.ts with connection pooling
- [ ] T011 [P] Create TypeScript interfaces for Challenge, DailyLog, ProgressMetrics in lib/challenge/types.ts
- [ ] T012 [P] Create Zod validation schemas in lib/challenge/validation.ts for Challenge and DailyLog
- [ ] T013 [P] Create date utility functions in lib/utils.ts: getTodayLocalDate(), getUserTimezone(), formatLocalDate()
- [ ] T014 [P] Create metrics calculator functions in lib/challenge/calculator.ts: calculateCurrentDay(), calculateStreak(), calculateCompletionRate()
- [ ] T015 Create ChallengeRepository interface and implementation in lib/challenge/repository.ts with all CRUD operations
- [ ] T016 [P] Initialize shadcn/ui with components CLI and configure touch target sizes (44x44px minimum)
- [ ] T017 [P] Create root layout in app/layout.tsx with mobile-first meta tags and global styles
- [ ] T018 [P] Create global CSS in app/globals.css with Tailwind imports

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create and Start Challenge (Priority: P1) 🎯 MVP

**Goal**: Users can create a challenge by specifying duration, which saves to Redis and redirects to the challenge dashboard

**Independent Test**: Create a challenge with a duration (e.g., 30 days), verify it saves to Redis with challenge:{id} key, verify redirect to /challenge/{id} with dashboard showing duration, current day (1), and status (active)

### Implementation for User Story 1

- [ ] T019 [P] [US1] Create shadcn/ui Button component in components/ui/button.tsx
- [ ] T020 [P] [US1] Create shadcn/ui Card component in components/ui/card.tsx
- [ ] T021 [P] [US1] Create shadcn/ui Input component in components/ui/input.tsx
- [ ] T022 [US1] Create ChallengeForm component in components/challenge/create-form.tsx with duration input and validation
- [ ] T023 [US1] Create challenge creation page in app/challenge/create/page.tsx using ChallengeForm component
- [ ] T024 [US1] Implement POST /api/challenge route handler in app/api/challenge/route.ts (create challenge, return challengeId)
- [ ] T025 [US1] Implement GET /api/challenge/[id]/route.ts to fetch challenge by ID
- [ ] T026 [US1] Create MetricsDisplay component in components/challenge/metrics-display.tsx showing current day, streak, personal best
- [ ] T027 [US1] Create Dashboard component in components/challenge/dashboard.tsx displaying challenge info and metrics
- [ ] T028 [US1] Create challenge dashboard page in app/challenge/[id]/page.tsx using Dashboard component
- [ ] T029 [US1] Create home page in app/page.tsx with "Start New Challenge" button linking to /challenge/create
- [ ] T030 [US1] Add error handling and user feedback for invalid duration (1-365 validation)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently (create challenge → see dashboard)

---

## Phase 4: User Story 2 - Log Daily Pushups (Priority: P2)

**Goal**: Users can log their daily pushup count using a stepper interface pre-filled with yesterday's count, enforcing once-per-day logging

**Independent Test**: Create a challenge (P1), navigate to logging interface, verify stepper defaults to 0 (day 1) or yesterday's count, log pushups, verify it saves and prevents duplicate logging same day

### Implementation for User Story 2

- [ ] T031 [P] [US2] Create LogStepper component in components/challenge/log-stepper.tsx with plus/minus buttons and number display
- [ ] T032 [US2] Implement POST /api/challenge/[id]/log/route.ts to create daily log entry
- [ ] T033 [US2] Implement GET /api/challenge/[id]/log/route.ts to fetch logs and check if today logged
- [ ] T034 [US2] Create logging page in app/challenge/[id]/log/page.tsx with LogStepper and submit button
- [ ] T035 [US2] Add yesterday count pre-fill logic using getYesterdayLog() from repository
- [ ] T036 [US2] Add duplicate logging prevention with error message display
- [ ] T037 [US2] Update Dashboard component to show hasLoggedToday status and link to logging page
- [ ] T038 [US2] Implement metrics recalculation on log submission (streak, personal best, total pushups, completion rate)
- [ ] T039 [US2] Add zero pushup validation (accept 0-10,000 range per FR-017)
- [ ] T040 [US2] Display updated metrics after successful log submission

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently (create → dashboard → log → see updated metrics)

---

## Phase 5: User Story 3 - View Progress Chart (Priority: P3)

**Goal**: Users can visualize their pushup progress over time with a vertical bar chart showing daily counts and distinguishing logged vs missed days

**Independent Test**: Create a challenge (P1), log pushups for multiple days (P2), navigate to progress chart, verify vertical bars display for logged days with correct counts and gaps/empty bars for missed days

### Implementation for User Story 3

- [ ] T041 [P] [US3] Register Chart.js components (CategoryScale, LinearScale, BarElement, Title, Tooltip) globally
- [ ] T042 [US3] Create ProgressChart component in components/challenge/progress-chart.tsx using react-chartjs-2 Bar chart
- [ ] T043 [US3] Implement chart data transformation: logs array → chart.js data format with date labels and pushup values
- [ ] T044 [US3] Add visual distinction for missed days (gaps in data or zero-height bars)
- [ ] T045 [US3] Configure chart for mobile: touch-friendly interactions, responsive sizing (min 200px, max 400px, 40vh)
- [ ] T046 [US3] Disable chart animations for performance with up to 365 data points
- [ ] T047 [US3] Create progress page in app/challenge/[id]/progress/page.tsx with ProgressChart
- [ ] T048 [US3] Add navigation link to progress page from Dashboard component
- [ ] T049 [US3] Handle empty state: display helpful message when no logs exist yet
- [ ] T050 [US3] Add chart tooltips showing exact count and date for each bar

**Checkpoint**: All user stories should now be independently functional (create → log → view chart)

---

## Phase 6: Completion & Edge Cases (Cross-Story)

**Purpose**: Handle challenge completion, abandonment, and edge cases that span multiple user stories

- [ ] T051 [P] Create CompletionSummary component in components/challenge/completion-summary.tsx displaying total pushups, completion rate, best day, final streak
- [ ] T052 Create completion page in app/challenge/[id]/complete/page.tsx using CompletionSummary
- [ ] T053 Add automatic redirect to completion page when challenge.status = 'completed'
- [ ] T054 Implement challenge abandonment: DELETE /api/challenge/[id]/route.ts
- [ ] T055 Add "Abandon Challenge" button to Dashboard with confirmation modal
- [ ] T056 Implement TTL management: set Redis expiration to (duration + 30 days) on challenge creation
- [ ] T057 Update TTL on log submission to refresh expiration
- [ ] T058 Add 404 handling for expired or non-existent challenge IDs
- [ ] T059 Add timezone change handling: follow current timezone for day boundaries
- [ ] T060 Handle challenge completion detection: update status when currentDay >= duration

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T061 [P] Create MobileNav component in components/layout/mobile-nav.tsx
- [ ] T062 [P] Create Header component in components/layout/header.tsx
- [ ] T063 [P] Add mobile navigation to all pages
- [ ] T064 [P] Ensure all touch targets meet 44x44px minimum (buttons, stepper controls, chart interactions)
- [ ] T065 [P] Add loading states for all async operations (create, log, fetch)
- [ ] T066 [P] Add error boundaries for graceful error handling
- [ ] T067 [P] Optimize Chart.js bundle with tree-shaking (only import needed components)
- [ ] T068 [P] Add Redis error handling and fallback UI
- [ ] T069 [P] Test responsive design at breakpoints: 320px, 375px, 768px, 1024px
- [ ] T070 Add PWA icons to public/icons/ directory
- [ ] T071 Update README.md with quickstart instructions
- [ ] T072 Verify quickstart.md instructions are accurate

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Completion (Phase 6)**: Depends on US1, US2, US3 completion
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1 but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Integrates with US1/US2 but independently testable

### Within Each User Story

- Components before pages
- API routes before pages that consume them
- Repository methods before API routes
- Validation before implementation
- Core features before edge cases

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002-T008)
- All Foundational tasks marked [P] can run in parallel (T011-T014, T016-T018)
- Once Foundational phase completes, US1/US2/US3 can start in parallel
- Within US1: shadcn components (T019-T021) can run in parallel
- Within US3: Chart registration (T041) can run with chart component (T042) development
- Polish phase tasks (T061-T069) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch shadcn/ui component setup in parallel:
Task T019: "Create shadcn/ui Button component"
Task T020: "Create shadcn/ui Card component"
Task T021: "Create shadcn/ui Input component"

# Then proceed sequentially:
Task T022: "Create ChallengeForm component" (uses T019-T021)
Task T023: "Create challenge creation page" (uses T022)
Task T024: "Implement POST /api/challenge" (parallel with page work)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test creating a challenge and viewing dashboard
5. Deploy/demo if ready - this is a minimal viable product

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP! Users can create challenges)
3. Add User Story 2 → Test independently → Deploy/Demo (Users can now log daily pushups)
4. Add User Story 3 → Test independently → Deploy/Demo (Users can now visualize progress)
5. Add Completion → Deploy/Demo (Full feature set complete)
6. Add Polish → Deploy/Demo (Production ready)

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T018)
2. Once Foundational is done:
   - Developer A: User Story 1 (T019-T030)
   - Developer B: User Story 2 (T031-T040)
   - Developer C: User Story 3 (T041-T050)
3. Team integrates: Completion phase (T051-T060)
4. Team completes: Polish phase (T061-T072)

---

## Summary

**Total Tasks**: 72
- Setup: 9 tasks
- Foundational: 9 tasks (CRITICAL BLOCKER)
- User Story 1: 12 tasks (P1 - MVP)
- User Story 2: 10 tasks (P2)
- User Story 3: 10 tasks (P3)
- Completion: 10 tasks
- Polish: 12 tasks

**Parallel Opportunities**: 23 tasks marked [P] can run in parallel
- Setup phase: 7 parallel tasks
- Foundational phase: 6 parallel tasks
- User stories: 3 stories can run in parallel after foundation
- Polish phase: 9 parallel tasks

**MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1 only) = 30 tasks
**Full Feature**: All 72 tasks

**Independent Test Criteria**:
- US1: Create challenge → See dashboard with duration, day 1, active status
- US2: Log pushups → Verify saved, metrics updated, duplicate prevented
- US3: View chart → See bars for logged days, gaps for missed days

---

## Notes

- All file paths assume Next.js App Router structure in repository root
- [P] tasks = different files, no dependencies within phase
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Stop at any checkpoint to validate story independently
- Redis connection string (REDIS_URL) must be configured in .env before running
- No authentication implemented - challenge ID in URL serves as access token
- Challenge ID is UUID v4 for security (122 bits entropy)
