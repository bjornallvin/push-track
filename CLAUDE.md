# push-track Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-18

## Active Technologies
- TypeScript 5.x with Next.js 14+ (App Router)
- React 18+
- Tailwind CSS 3.x
- shadcn/ui
- Chart.js 4.x
- Redis (standard package)
- TypeScript 5.x with Next.js 14+ (App Router) + React 18+, React Hook Form + Zod resolvers, shadcn/ui components, Chart.js 4.x with react-chartjs-2, Redis (standard package), lucide-react icons (003-late-entry-editing)
- Redis sorted sets (`challenge:{id}:logs`) with date-based scoring (003-late-entry-editing)
- TypeScript 5.4.0 with Next.js 14.2.0 (App Router) + React 18.3.1 + react-hook-form (7.65.0), zod (3.25.76), shadcn/ui components, tailwindcss (3.4.0), lucide-react (0.378.0) (004-my-challenges-homepage)
- Browser localStorage (client-side only) - no server-side storage for this feature (004-my-challenges-homepage)

## Project Structure
```
app/
components/
lib/
public/
```

## Commands
npm run lint

## Code Style
TypeScript 5.x with Next.js 14+ (App Router): Follow standard conventions

## Recent Changes
- 004-my-challenges-homepage: Added TypeScript 5.4.0 with Next.js 14.2.0 (App Router) + React 18.3.1 + react-hook-form (7.65.0), zod (3.25.76), shadcn/ui components, tailwindcss (3.4.0), lucide-react (0.378.0)
- 003-late-entry-editing: Added TypeScript 5.x with Next.js 14+ (App Router) + React 18+, React Hook Form + Zod resolvers, shadcn/ui components, Chart.js 4.x with react-chartjs-2, Redis (standard package), lucide-react icons
- 001-pushup-challenge-app: URL-based authentication, Chart.js for visualization, standard Redis for storage

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
