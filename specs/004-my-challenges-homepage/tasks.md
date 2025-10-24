# Implementation Tasks: Quick Challenge Access

**Feature**: Quick Challenge Access (004-my-challenges-homepage)
**Branch**: `004-my-challenges-homepage`
**Date**: 2025-10-24

## Overview

This document breaks down the implementation of the Quick Challenge Access feature into atomic, executable tasks organized by user story priority. Each user story can be implemented and tested independently.

**Implementation Strategy**: UI-First Development (Constitution Principle VI)
- Phase 1: Setup - Project structure and dependencies
- Phase 2: Foundational - Core localStorage utilities
- Phase 3: User Story 1 (P1) - Single challenge quick access (MVP)
- Phase 4: User Story 2 (P2) - Multiple challenges display
- Phase 5: User Story 3 (P3) - Manual challenge removal
- Phase 6: Polish - Edge cases, mobile testing, final QA

**Total Estimated Tasks**: 29 tasks

---

## Phase 1: Setup (4 tasks)

**Goal**: Initialize project structure and create necessary directories.

### Tasks

- [x] T001 Create localStorage utilities directory at `/lib/localStorage/`
- [x] T002 Create TypeScript config for strict mode verification (confirm tsconfig.json has `"strict": true`)
- [x] T003 Verify shadcn/ui components available: Button, Card (at `/components/ui/`)
- [x] T004 Install lucide-react icons if not present (check package.json, run `npm install lucide-react` if needed)

**Completion Criteria**: All directories exist, dependencies installed, TypeScript strict mode enabled.

---

## Phase 2: Foundational (6 tasks)

**Goal**: Build core localStorage utilities and type system that all user stories depend on.

### Tasks

- [x] T005 [P] Create constants file at `/lib/localStorage/constants.ts` with `STORAGE_KEY = 'push-track:recentChallenges'` and `STORAGE_VERSION = 1`
- [x] T006 [P] Create types file at `/lib/localStorage/types.ts` with `RecentChallengeSchema` and `StorageDataSchema` Zod schemas
- [x] T007 [P] Add sanitization utility `sanitizeText()` function to `/lib/utils.ts` for XSS prevention
- [x] T008 Create localStorage CRUD utilities at `/lib/localStorage/recent-challenges.ts` with functions: `saveRecentChallenge()`, `getRecentChallenges()`, `getRecentChallengesSorted()`, `removeRecentChallenge()`, `clearRecentChallenges()`
- [x] T009 Create conversion utility at `/lib/localStorage/utils.ts` with `challengeToRecentChallenge()` function to convert `Challenge` → `RecentChallenge`
- [x] T010 Add error handling and validation to all localStorage functions (try-catch, Zod validation, corrupted data clearing)

**Completion Criteria**: All utility functions created, tested with manual localStorage operations in browser devtools.

**Independent Test**: Can manually test each utility function by:
1. Opening browser devtools console
2. Importing functions (if using module bundler) or pasting code
3. Calling `saveRecentChallenge(mockData)` and verifying localStorage updated
4. Calling `getRecentChallenges()` and verifying data returned
5. Testing with corrupted data (invalid JSON, wrong version) and verifying graceful handling

---

## Phase 3: User Story 1 - Quick Return to Active Challenge (P1) (9 tasks)

**Goal**: Display a single challenge quick access link on homepage after visiting a challenge page.

**Why P1**: Core MVP - enables users to quickly return to their most recent challenge.

**Independent Test Criteria**:
1. Visit any challenge page (e.g., `/challenge/550e8400-e29b-41d4-a716-446655440000`)
2. Navigate to homepage (`/`)
3. Verify "Your Recent Challenges" section appears
4. Verify challenge card displays with correct duration and activities
5. Click "Continue Challenge" button
6. Verify navigation to correct challenge page
7. Empty state: Clear localStorage, refresh homepage, verify section hidden

### Substep 3.1: UI Prototype with Static Data (Principle VI)

- [x] T011 [US1] Create mock data file at `/lib/localStorage/mock-data.ts` with 2-3 sample `RecentChallenge` objects for UI development
- [x] T012 [US1] Create `RecentChallenges` component at `/components/recent-challenges.tsx` with `'use client'` directive and hydration guard (`mounted` state)
- [x] T013 [US1] Implement `ChallengeCard` subcomponent within `/components/recent-challenges.tsx` with Card UI, truncation, and "Continue Challenge" button
- [x] T014 [US1] Add `getRelativeTime()` helper function to `/components/recent-challenges.tsx` for timestamp formatting ("2h ago", "yesterday")
- [x] T015 [US1] Import and render `<RecentChallenges />` in `/app/page.tsx` below hero section, above CTA card

**Checkpoint**: Test UI prototype on mobile (320px, 375px) and desktop. Verify:
- Touch targets ≥44x44px
- Text truncation works for long activity names
- Gradients match homepage aesthetic
- Empty state hides section

### Substep 3.2: localStorage Integration

- [x] T016 [US1] Update `RecentChallenges` component to use `getRecentChallengesSorted()` instead of mock data in `useEffect` hook
- [x] T017 [US1] Remove `/lib/localStorage/mock-data.ts` file (no longer needed)
- [x] T018 [US1] Create `SaveToRecent` component at `/components/challenge/save-to-recent.tsx` with `'use client'` directive, accepts `challenge` prop, calls `saveRecentChallenge()` in `useEffect`
- [x] T019 [US1] Add `<SaveToRecent challenge={challenge} />` to `/app/challenge/[id]/page.tsx` server component (import and render above `<Dashboard />`)

**Completion Criteria**:
- Challenge automatically saved when visiting challenge page
- Homepage displays saved challenge after navigation
- localStorage contains correct JSON structure
- Component renders within 100ms (performance target)

**Independent Test**: Follow test criteria at phase start. All 7 scenarios should pass.

---

## Phase 4: User Story 2 - Multiple Recent Challenges (P2) (4 tasks)

**Goal**: Display all visited challenges on homepage, sorted by most recent first.

**Why P2**: Enhances MVP for users with multiple active challenges.

**Independent Test Criteria**:
1. Visit 3 different challenge pages in sequence
2. Navigate to homepage
3. Verify all 3 challenges appear
4. Verify challenges ordered by most recent first (last visited at top)
5. Click middle challenge
6. Return to homepage
7. Verify clicked challenge moved to top

### Tasks

- [x] T020 [US2] Update `RecentChallenges` component rendering logic to display all challenges from `getRecentChallengesSorted()` array (already implemented in US1, verify it works with multiple)
- [x] T021 [US2] Add responsive grid layout to `/components/recent-challenges.tsx`: `flex-col gap-4 md:grid md:grid-cols-2 lg:grid-cols-3`
- [x] T022 [US2] Test with 5+ challenges: Create manual test script to add 5 challenges to localStorage via devtools
- [x] T023 [US2] Verify sorting: Visit oldest challenge, return to homepage, verify it moved to top of list

**Completion Criteria**:
- All challenges display correctly
- Sorting by `lastVisited` works
- Responsive grid layout renders on desktop
- No performance degradation with 10+ challenges

**Independent Test**: Follow test criteria at phase start. All 7 scenarios should pass.

---

## Phase 5: User Story 3 - Challenge Removal (P3) (3 tasks)

**Goal**: Allow users to manually remove challenges from their recent list.

**Why P3**: Nice-to-have for list management, not critical for launch.

**Independent Test Criteria**:
1. With 3 challenges displayed on homepage
2. Click "remove" button (trash icon) on middle challenge
3. Verify challenge immediately disappears
4. Verify localStorage updated (check devtools)
5. Remove all challenges one by one
6. Verify section hides when last challenge removed
7. Visit removed challenge page again
8. Return to homepage
9. Verify challenge reappears in list

### Tasks

- [x] T024 [P] [US3] Add Trash2 icon from lucide-react to `ChallengeCard` component in `/components/recent-challenges.tsx` with hover reveal (`opacity-0 group-hover:opacity-100`)
- [x] T025 [US3] Implement `handleRemove()` callback in `RecentChallenges` component that calls `removeRecentChallenge(id)` and updates local state with `setChallenges(prev => prev.filter(c => c.id !== id))`
- [x] T026 [US3] Wire `handleRemove` callback to Trash2 button `onClick` handler with `e.preventDefault()` to avoid link navigation

**Completion Criteria**:
- Remove button appears on hover (desktop) or always visible (mobile)
- Clicking remove immediately updates UI
- localStorage updated correctly
- Empty state works after removing all challenges
- Re-visiting removed challenge re-adds it to list

**Independent Test**: Follow test criteria at phase start. All 9 scenarios should pass.

---

## Phase 6: Polish & Cross-Cutting Concerns (3 tasks)

**Goal**: Handle edge cases, test on all viewports, and verify constitution compliance.

### Tasks

- [ ] T027 Test edge cases: (1) Corrupted localStorage (set to `{invalid`), (2) localStorage disabled (incognito mode), (3) Invalid challenge ID (set to `"not-a-uuid"`), (4) Missing required fields - verify all degrade gracefully with console warnings
- [ ] T028 Mobile viewport testing: Test on 320px, 375px, 768px breakpoints - verify touch targets ≥44x44px, text truncation works, no horizontal scroll, cards render correctly
- [x] T029 Run `npm run lint` for TypeScript type checking - verify no errors in new files, confirm strict mode compliance

**Completion Criteria**:
- All edge cases handled gracefully (no user-facing errors)
- Mobile testing passes on all breakpoints
- Dark mode works (test by toggling theme)
- TypeScript strict mode passes
- Performance targets met (<100ms render, <10ms localStorage operations)

---

## Dependencies & Execution Order

### User Story Dependency Graph

```
Setup (Phase 1)
  ↓
Foundational (Phase 2)
  ↓
US1 (P1) ← MVP - Can ship after this
  ↓
US2 (P2) ← Independent of US3
  ↓
US3 (P3) ← Independent of US2 (could be done in parallel)
  ↓
Polish (Phase 6)
```

### Critical Path

1. **Setup** (T001-T004) → Required for all work
2. **Foundational** (T005-T010) → Blocks all user stories
3. **US1 UI Prototype** (T011-T015) → Blocks US1 integration
4. **US1 Integration** (T016-T019) → **MVP COMPLETE**
5. **US2** (T020-T023) → Can run in parallel with US3
6. **US3** (T024-T026) → Can run in parallel with US2
7. **Polish** (T027-T029) → Final validation

### Parallel Execution Opportunities

**Phase 2 (Foundational)**: Tasks T005, T006, T007 can run in parallel (different files)

**Phase 5 (US3)**: Task T024 can run in parallel with US2 tasks (different component sections)

**Phase 6 (Polish)**: Tasks T027, T028, T029 can be run in any order

---

## Testing Strategy

### Manual Testing Checklist

**Per User Story**:
- [ ] US1: Follow "Independent Test Criteria" (7 scenarios)
- [ ] US2: Follow "Independent Test Criteria" (7 scenarios)
- [ ] US3: Follow "Independent Test Criteria" (9 scenarios)

**Cross-Cutting**:
- [ ] Mobile: 320px, 375px, 768px viewports
- [ ] Dark mode: Toggle and verify contrast
- [ ] Edge cases: Corrupted data, disabled localStorage, invalid IDs
- [ ] Performance: localStorage <10ms, render <100ms
- [ ] TypeScript: `npm run lint` passes

### Success Metrics (from spec.md)

- **SC-001**: Users can access challenge in 1 click ✓
- **SC-002**: Render <100ms ✓ (measure via Chrome DevTools Performance tab)
- **SC-003**: 90% save success rate ✓ (manual verification during testing)
- **SC-004**: 50% time savings ✓ (qualitative assessment)
- **SC-005**: Zero errors when localStorage unavailable ✓ (incognito test)

---

## MVP Scope Recommendation

**Ship after Phase 3 (US1) completion** for fastest user value:
- Tasks T001-T019 (19 tasks)
- Delivers core feature: Quick return to most recent challenge
- Independently testable and valuable

**Optional enhancements** (ship incrementally):
- Phase 4 (US2): Multiple challenges support
- Phase 5 (US3): Manual removal
- Phase 6: Final polish

---

## Implementation Notes

### Constitution Compliance Verification

- **I. Mobile-First**: Tasks T028 enforces 320px testing
- **II. Simplicity**: Zero new dependencies (uses existing shadcn/ui, Zod)
- **III. Type Safety**: Tasks T002, T006, T029 enforce TypeScript strict + Zod
- **IV. Progressive Enhancement**: Component marked `'use client'`, homepage works without JS
- **V. Observability**: Error handling in T010 includes console warnings
- **VI. UI-First**: Phase 3 explicitly separates UI prototype (T011-T015) from integration (T016-T019)

### Key Files Modified

**New Files** (7 total):
- `/lib/localStorage/constants.ts`
- `/lib/localStorage/types.ts`
- `/lib/localStorage/recent-challenges.ts`
- `/lib/localStorage/utils.ts`
- `/lib/localStorage/mock-data.ts` (temporary, deleted in T017)
- `/components/recent-challenges.tsx`
- `/components/challenge/save-to-recent.tsx`

**Modified Files** (2 total):
- `/lib/utils.ts` (add `sanitizeText()`)
- `/app/page.tsx` (add `<RecentChallenges />`)
- `/app/challenge/[id]/page.tsx` (add `<SaveToRecent />`)

---

## Task Format Reference

All tasks follow strict format:
```
- [ ] [TaskID] [P] [Story] Description with file path
```

- **TaskID**: Sequential (T001, T002, etc.)
- **[P]**: Present if task can run in parallel (different files, no dependencies)
- **[Story]**: [US1], [US2], [US3] for user story tasks (not present in Setup/Foundational/Polish)
- **Description**: Action verb + specific file path

---

**Ready for Implementation** - Use `/speckit.implement` to begin executing tasks sequentially or in parallel where marked.
