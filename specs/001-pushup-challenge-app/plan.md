# Implementation Plan: Pushup Challenge Tracker

**Branch**: `001-pushup-challenge-app` | **Date**: 2025-10-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-pushup-challenge-app/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

A mobile-first web application for tracking daily pushup performance over a user-defined challenge period. Users create challenges by setting a duration, log their daily pushup counts using a stepper interface (defaulting to yesterday's count), and visualize progress via a vertical bar chart. The app focuses on habit formation (daily logging consistency) rather than performance targets, with key metrics being current day, streak count (non-zero days only), and personal best.

Technical approach: Next.js 14+ with App Router for server-side rendering and mobile optimization, Tailwind CSS + shadcn/ui for touch-friendly mobile UI, Redis for fast session-based storage (no authentication), TypeScript for type safety, and Chart.js for responsive bar chart visualization. Deployed on Vercel with serverless functions for low-latency mobile access.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 14+ (App Router)
**Primary Dependencies**: Next.js 14+, React 18+, Tailwind CSS 3.x, shadcn/ui, Chart.js 4.x, redis (standard package)
**Storage**: Redis (standard package) - session-based key-value storage, no persistent database required for MVP
**Target Platform**: Mobile-first web (iOS Safari, Chrome Mobile), progressive web app capabilities, desktop as secondary
**Project Type**: Web application (Next.js full-stack with API routes)

**Constraints**:
- All interactive elements minimum 44x44px touch targets (SC-008)
- Mobile-first responsive design (breakpoints: 320px, 375px, 768px, 1024px)
- Browser local timezone for day boundaries
- Single active challenge per session
- No authentication (session-based via Redis)
- Zero-configuration deployment (Vercel)

**Scale/Scope**:
- Single user per browser session
- Challenge duration: 1-365 days
- Daily entries: up to 365 per challenge
- Pushup count: 0-10,000 per entry
- Concurrent users: 100+ (initial MVP target)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ No constitution defined yet - first feature sets the baseline

**Note**: This is the first feature in the repository. The constitution file is currently a template. This implementation will establish the foundational patterns and principles for the project.

**Recommended Constitution Principles** (to be formalized):
1. **Mobile-First**: All features must be designed for mobile before desktop
2. **Simplicity**: Prefer standard patterns over custom abstractions (Next.js conventions, shadcn/ui defaults)
3. **Type Safety**: TypeScript strict mode required, no `any` types without justification

## Project Structure

### Documentation (this feature)

```
specs/001-pushup-challenge-app/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (next)
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
│   └── api-routes.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
# Next.js Web Application Structure

app/
├── layout.tsx                    # Root layout (mobile-first meta tags)
├── page.tsx                      # Home/dashboard (challenge view or create prompt)
├── challenge/
│   ├── create/
│   │   └── page.tsx             # Challenge creation form (P1)
│   └── [id]/
│       ├── page.tsx             # Challenge dashboard (current day, streak, metrics)
│       ├── log/
│       │   └── page.tsx         # Daily logging interface (P2 - stepper UI)
│       ├── progress/
│       │   └── page.tsx         # Progress chart view (P3)
│       └── complete/
│           └── page.tsx         # Completion summary screen
├── api/
│   └── challenge/
│       ├── route.ts             # POST /api/challenge (create, returns challengeId)
│       └── [id]/
│           ├── route.ts         # GET /api/challenge/[id], DELETE /api/challenge/[id] (abandon)
│           └── log/
│               └── route.ts     # POST /api/challenge/[id]/log, GET /api/challenge/[id]/log
└── globals.css                   # Tailwind imports

components/
├── ui/                          # shadcn/ui components (button, input, card, etc.)
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   └── ...
├── challenge/
│   ├── create-form.tsx          # Challenge creation form with validation
│   ├── dashboard.tsx            # Challenge dashboard with metrics
│   ├── log-stepper.tsx          # Plus/minus stepper input (pre-filled with yesterday)
│   ├── progress-chart.tsx       # Recharts vertical bar chart
│   ├── completion-summary.tsx   # Completion screen with stats
│   └── metrics-display.tsx      # Current day, streak, personal best
└── layout/
    ├── mobile-nav.tsx           # Mobile navigation
    └── header.tsx               # App header

lib/
├── redis.ts                     # Redis client setup
├── challenge/
│   ├── types.ts                 # Challenge, DailyLog, ProgressMetrics types
│   ├── validation.ts            # Zod schemas for validation
│   ├── calculator.ts            # Streak, completion rate, metrics calculations
│   └── repository.ts            # Redis data access layer (CRUD operations)
└── utils.ts                     # Date utilities, formatters, timezone detection

public/
└── icons/                       # PWA icons for mobile

.env                             # Redis connection string (REDIS_URL)
next.config.js                   # Next.js configuration
tailwind.config.ts               # Tailwind + shadcn theme
tsconfig.json                    # TypeScript strict configuration
```

**Structure Decision**: Next.js App Router structure selected because:
1. Server components reduce mobile bundle size
2. API routes co-located with frontend (single deployment)
3. Built-in mobile optimization (image optimization, font loading)
4. Vercel deployment is zero-configuration
5. App Router enables better mobile performance vs Pages Router

## Complexity Tracking

*No constitution violations - this is the first feature establishing the baseline.*

---

## Phase 0: Research & Technology Validation

**Status**: ✅ Complete

### Research Tasks

1. **Next.js 14 + Redis Session Management**
   - Validate Upstash Redis works with Vercel Edge runtime
   - Determine session ID strategy (cookie-based vs URL-based)
   - Research TTL strategy for abandoned challenges

2. **Mobile-First Performance Patterns**
   - Next.js image optimization for mobile
   - CSS bundle splitting strategies
   - Service worker for offline capability (future consideration)

3. **Recharts Mobile Optimization**
   - Touch event handling for bar chart interactions
   - Responsive sizing strategies for small screens
   - Performance with 365 data points (max challenge length)

4. **Date/Timezone Handling**
   - Browser timezone detection (Intl API)
   - Day boundary calculation (midnight in local timezone)
   - Validation for "already logged today" logic

5. **shadcn/ui Mobile Adaptations**
   - Touch target sizing compliance (44x44px minimum)
   - Form validation patterns for stepper input
   - Mobile drawer/modal patterns for error states

**Output**: ✅ [research.md](./research.md) - Complete

---

## Phase 1: Design & Contracts

**Status**: ✅ Complete

### Deliverables

1. **Data Model** ([data-model.md](./data-model.md))
   - Challenge entity (Redis hash structure)
   - DailyLog entity (Redis sorted set structure)
   - Session entity (Redis string with TTL)
   - Calculated metrics (streak, personal best, completion rate)

2. **API Contracts** ([contracts/api-routes.md](./contracts/api-routes.md))
   - REST API endpoints with request/response schemas
   - Validation rules (Zod schemas)
   - Error response formats

3. **Quickstart Guide** ([quickstart.md](./quickstart.md))
   - Local development setup
   - Redis local testing (Upstash CLI)
   - Mobile testing via ngrok/Vercel preview
   - Environment variable configuration

4. **Agent Context Update**
   - Technology stack added to CLAUDE.md
   - Next.js, Redis, Tailwind conventions documented

**Output**: ✅ All deliverables complete:
- [data-model.md](./data-model.md) - Redis schema and entity definitions
- [contracts/api-routes.md](./contracts/api-routes.md) - REST API specifications
- [quickstart.md](./quickstart.md) - Development setup guide
- CLAUDE.md - Agent context with technology stack

---

## Phase 2: Task Generation

**Status**: Not started (run `/speckit.tasks` after Phase 1 complete)

This phase is handled by the `/speckit.tasks` command, which will generate a dependency-ordered task breakdown based on the design artifacts produced in Phase 1.

**Expected Output**: [tasks.md](./tasks.md) with actionable implementation tasks

---

## Notes

- **Future Enhancements** (out of scope for MVP):
  - Challenge history retention
  - Multiple concurrent challenges
  - User authentication
  - Social features (sharing, leaderboards)
  - Notifications/reminders
  - Export data functionality
