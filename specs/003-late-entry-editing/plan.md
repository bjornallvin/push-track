# Implementation Plan: Late Entry Editing

**Branch**: `003-late-entry-editing` | **Date**: 2025-10-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-late-entry-editing/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enable users to edit activity data for past days directly from the progress page. Users can click an edit button on any past day to modify or add activity entries using the same interface as the current daily logging form. The feature reuses existing UI components and follows mobile-first design principles with 44x44px touch targets. No late-entry metadata or bulk editing is included in this release.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 14+ (App Router)
**Primary Dependencies**: React 18+, React Hook Form + Zod resolvers, shadcn/ui components, Chart.js 4.x with react-chartjs-2, Redis (standard package), lucide-react icons
**Storage**: Redis sorted sets (`challenge:{id}:logs`) with date-based scoring
**Testing**: Manual testing (per constitution), TypeScript + Zod for type safety
**Target Platform**: Web (mobile-first: iOS Safari 15+, Chrome Android 100+; desktop: Chrome 100+, Safari 15+, Firefox 100+)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: API response < 500ms for reads, < 1s for writes; chart updates immediate (no page refresh)
**Constraints**: 44x44px minimum touch targets, 320px minimum viewport width, server-first rendering for critical paths
**Scale/Scope**: Single feature adding edit capability to existing progress chart; reuses ActivityLogger component (~200 lines)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ I. Mobile-First Design (NON-NEGOTIABLE)
- **Status**: PASS
- **Evidence**: FR-003 mandates 44x44px touch targets for edit buttons; spec explicitly requires mobile-first UX
- **Implementation**: Edit buttons will use standard button components with minimum touch target sizing; responsive breakpoints 320px/375px/768px/1024px

### ✅ II. Simplicity Over Features
- **Status**: PASS
- **Evidence**: Bulk editing deferred (clarification session); no late-entry metadata tracking; reuses existing ActivityLogger component
- **Implementation**: Minimal scope change - add edit button + date parameter to existing form, no new abstractions

### ✅ III. Type Safety & Validation
- **Status**: PASS
- **Evidence**: Will use existing Zod schemas (LogRepsRequestSchema) with date parameter addition; React Hook Form + Zod resolvers
- **Implementation**: Extend existing validation, no `any` types, strict mode enabled

### ✅ IV. Progressive Enhancement
- **Status**: PASS
- **Evidence**: Reuses existing ActivityLogger which already follows server component pattern; forms submit via HTTP POST
- **Implementation**: Edit button triggers client component for interactivity, but form submission remains standard POST

### ✅ V. Observability Through Simplicity
- **Status**: PASS
- **Evidence**: Reuses existing API route patterns with clear error messages; Redis logging unchanged
- **Implementation**: Add date to existing log operations, maintain shallow component hierarchy (max 3 levels)

### ✅ VI. UI-First Development
- **Status**: PASS
- **Evidence**: Clarification session confirms UI prototype with static data first
- **Implementation**: Phase 1 will build functional prototype with mock date selection before API integration

**Overall Gate Status**: ✅ PASS - No violations, no complexity justification needed

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
app/
├── challenge/
│   └── [id]/
│       ├── progress/
│       │   └── page.tsx              # Progress chart page (ADD edit buttons here)
│       └── edit/
│           └── page.tsx              # NEW: Edit specific date page
│
├── api/
│   └── challenge/
│       └── [id]/
│           └── log/
│               └── route.ts          # MODIFY: Add date parameter support

components/
├── challenge/
│   ├── activity-logger.tsx           # REUSE: Existing multi-activity form
│   ├── progress-chart.tsx            # MODIFY: Add edit buttons per day
│   └── edit-day-button.tsx           # NEW: Edit button component
│
└── ui/                                # shadcn/ui components (no changes)

lib/
├── challenge/
│   ├── repository.ts                 # MODIFY: Support date-specific log operations
│   ├── calculator.ts                 # No changes (metrics recalc works as-is)
│   ├── types.ts                      # EXTEND: Add date field to request types
│   └── validation.ts                 # EXTEND: Add date validation schema
│
└── utils.ts                           # Utility functions (date helpers)
```

**Structure Decision**: Next.js 14 App Router structure. The feature integrates into existing pages and components with minimal new files. Key changes are adding edit buttons to the progress chart, creating a new edit page that reuses ActivityLogger, and extending the API route to accept date parameters.

## Complexity Tracking

*No violations detected - this section is empty per constitution compliance.*

