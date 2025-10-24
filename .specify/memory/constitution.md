# Push-Track Constitution

<!--
Sync Impact Report - Version 1.1.1
================================================
Version Change: 1.1.0 → 1.1.1 (PATCH)
Modified Principles:
  - Principle VI: UI-First Development - Added UI prototyping requirement
Added Sections: N/A
Removed Sections: N/A
Templates Status:
  ✅ .specify/templates/spec-template.md - reviewed, no updates needed
  ✅ .specify/templates/plan-template.md - reviewed, no updates needed
  ✅ .specify/templates/tasks-template.md - reviewed, aligns with clarification
  ✅ .specify/templates/checklist-template.md - reviewed, no updates needed
  ✅ .specify/templates/agent-file-template.md - reviewed, no updates needed
Follow-up TODOs: None
Rationale: Clarifying Principle VI to explicitly require UI prototypes for design
demos. This is a non-semantic refinement that expands implementation guidance
without changing the fundamental nature of the principle (PATCH bump).
================================================
-->

## Core Principles

### I. Mobile-First Design (NON-NEGOTIABLE)

All user interfaces MUST be designed and implemented with mobile devices as the primary target. Desktop experiences are enhancements, not the baseline.

**Requirements:**
- Touch targets MUST meet minimum 44x44px size
- Responsive breakpoints: 320px (minimum), 375px, 768px, 1024px
- Test on mobile viewport first, then scale up
- All interactive elements MUST be thumb-reachable in single-handed use

**Rationale:** Push-Track is used during workouts when users have limited attention and often use one hand. Mobile-first ensures the core experience works where it matters most.

### II. Simplicity Over Features

Choose simple, maintainable solutions over feature-rich complexity. When in doubt, ship the minimal viable version first.

**Requirements:**
- No speculative features ("we might need this later")
- Prefer standard library solutions over external dependencies
- Each feature MUST solve a validated user problem
- Complexity MUST be justified in feature specifications before implementation

**Rationale:** Push-Track thrives on simplicity. URL-based access, no authentication, and straightforward data models keep the app maintainable by a small team and fast for users.

### III. Type Safety & Validation

All data crossing boundaries (API, user input, external services) MUST be validated using Zod schemas. TypeScript strict mode is mandatory.

**Requirements:**
- API endpoints MUST validate request/response with Zod
- Form inputs MUST use React Hook Form + Zod resolvers
- Redis data MUST be validated on read
- No `any` types except for truly dynamic third-party integrations (must be documented)

**Rationale:** With no authentication layer and URL-based access, data validation is our primary defense against malformed inputs and ensures Redis data integrity.

### IV. Progressive Enhancement

Core functionality MUST work without JavaScript. Enhanced experiences (charts, real-time updates) layer on top.

**Requirements:**
- Server Components by default (Next.js App Router)
- Client Components only when interactivity required
- Forms MUST submit via standard HTTP POST (then enhance with JS)
- Critical paths (create challenge, log activity) MUST not depend on client-side routing

**Rationale:** Mobile networks are unreliable during workouts. Server-first rendering ensures users can log activities even on slow/failing connections.

### V. Observability Through Simplicity

Debugging MUST be straightforward through structured logging, clear error messages, and minimal abstraction layers.

**Requirements:**
- API errors MUST return actionable messages to users
- Server logs MUST include request IDs, timestamps, and relevant context
- Redis operations MUST log keys and operations for troubleshooting
- Component hierarchy MUST remain shallow (max 3 levels of composition)

**Rationale:** With production and development sharing the same Redis instance, clear observability prevents accidental data corruption and speeds up issue resolution.

### VI. UI-First Development

For features involving UI components, implementation MUST begin with UI design using static data before integrating backend logic and API connections.

**Requirements:**
- Build UI prototypes with static/mock data for design demonstrations
- Prototypes MUST be functional (clickable, interactive) to validate user flows
- Verify visual design, interactions, and responsive behavior in isolation
- Only after prototype approval, integrate with real APIs and backend logic
- Use component composition patterns (shadcn/ui) to maintain reusability

**Rationale:** UI prototypes enable early design validation and stakeholder feedback without backend dependencies. Separating UI development from backend integration allows faster design iteration, easier visual review, and cleaner component boundaries. Static data exposes edge cases (empty states, long text, errors) earlier in the development cycle.

## Quality Standards

### Performance Targets

- **Initial page load**: < 2s on 3G connection
- **Time to Interactive**: < 3s on mobile
- **API response time**: < 500ms for reads, < 1s for writes
- **Chart rendering**: < 1s for 365 days of data

### Accessibility Requirements

- WCAG 2.1 Level AA compliance MUST be verified for:
  - Form controls (labels, error states, focus indicators)
  - Touch targets (minimum 44x44px)
  - Color contrast (4.5:1 for text, 3:1 for interactive)
- Semantic HTML MUST be used (no `<div>` buttons)

### Browser & Device Support

- **Mobile**: iOS Safari 15+, Chrome Android 100+
- **Desktop**: Chrome 100+, Safari 15+, Firefox 100+
- **Responsive breakpoints**: 320px minimum width

## Development Workflow

### Feature Development Process

1. **Specification**: Run `/speckit.specify` and `/speckit.clarify` before implementation
2. **Planning**: Run `/speckit.plan` to generate implementation plan
3. **Task Execution**: Follow `/speckit.implement` workflow with atomic commits
   - For UI features: Build functional prototypes with static data first (Principle VI)
   - Demo prototype for design approval
   - After approval, integrate with real APIs and backend logic
4. **Verification**: Test on mobile viewport first, then other sizes

### Code Review Gates

All pull requests MUST pass:
- TypeScript type checking (`npm run lint`)
- Mobile viewport manual testing (320px, 375px)
- Zod schema validation for all data boundaries
- Touch target verification (44x44px minimum)
- UI prototype demonstration (for new UI features)

### Testing Philosophy

- **Manual testing**: Primary method for UI/UX verification
- **Type safety**: TypeScript + Zod provide compile-time guarantees
- **Integration testing**: Optional, use for critical Redis operations if needed
- **E2E testing**: Not required for v1.x releases

**Rationale:** Push-Track prioritizes shipping and iterating quickly. Type safety and manual testing provide sufficient confidence without the overhead of comprehensive test suites.

## Governance

### Amendment Process

1. Propose change via pull request to `.specify/memory/constitution.md`
2. Update dependent templates (`.specify/templates/*.md`) in same PR
3. Increment version following semantic versioning:
   - **MAJOR**: Backward-incompatible principle removals/redefinitions
   - **MINOR**: New principles or materially expanded guidance
   - **PATCH**: Clarifications, wording fixes, non-semantic refinements
4. Update `LAST_AMENDED_DATE` to amendment date

### Compliance Verification

- All feature specifications (`.specify/features/*/spec.md`) MUST reference applicable principles
- All implementation plans (`.specify/features/*/plan.md`) MUST include constitution compliance checks
- Pull request reviews MUST verify adherence to NON-NEGOTIABLE principles

### Conflict Resolution

- Constitution supersedes all other documentation (README, CLAUDE.md, etc.)
- In case of conflicting guidance, mobile-first and simplicity principles take precedence
- Ambiguities MUST be resolved by amending this constitution (not worked around)

### Runtime Guidance

For day-to-day development guidance not requiring constitutional governance, refer to `CLAUDE.md` in the repository root.

**Version**: 1.1.1 | **Ratified**: 2025-10-24 | **Last Amended**: 2025-10-24
