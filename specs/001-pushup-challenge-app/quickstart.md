# Quickstart Guide: Pushup Challenge Tracker

**Last Updated**: 2025-10-18
**Prerequisites**: Node.js 18+, pnpm (or npm/yarn)

---

## Quick Start (5 minutes)

```bash
# 1. Clone and install
git clone https://github.com/bjornallvin/push-track.git
cd push-track
pnpm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Upstash Redis credentials

# 3. Run development server
pnpm dev

# 4. Open browser
open http://localhost:3000
```

---

## Prerequisites

### Required Software

- **Node.js**: 18.17.0 or later
- **Package Manager**: pnpm 8+ (recommended), npm 9+, or yarn 1.22+
- **Git**: Latest version

### Upstash Redis Account (Free Tier)

1. Go to [upstash.com](https://upstash.com)
2. Sign up (free tier: 10,000 commands/day)
3. Create a new Redis database:
   - Name: `push-track-dev`
   - Region: Choose closest to you
   - Type: Regional (free tier)
4. Copy credentials (see Environment Setup below)

---

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/bjornallvin/push-track.git
cd push-track
```

### 2. Install Dependencies

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install

# Or using yarn
yarn install
```

**Dependencies installed**:
- Next.js 14+
- React 18+
- Tailwind CSS 3.x
- shadcn/ui components
- Chart.js + react-chartjs-2
- Upstash Redis (@upstash/redis)
- Zod (validation)
- React Hook Form
- TypeScript 5.x

---

## Environment Setup

### Create `.env.local`

```bash
cp .env.example .env.local
```

### Add Upstash Credentials

Edit `.env.local`:

```bash
# Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Vercel Analytics (production only)
# NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
```

**Where to find Upstash credentials**:
1. Go to Upstash Console → Your Database
2. Scroll to "REST API" section
3. Copy `UPSTASH_REDIS_REST_URL`
4. Copy `UPSTASH_REDIS_REST_TOKEN`

---

## Development

### Run Development Server

```bash
pnpm dev
```

Server runs at [http://localhost:3000](http://localhost:3000)

**Hot reload enabled**:
- Changes to components auto-reload
- API route changes restart dev server
- Tailwind CSS changes apply instantly

---

### Project Structure

```
push-track/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   ├── challenge/
│   │   ├── create/              # Challenge creation
│   │   └── [id]/                # Challenge dashboard & logging
│   └── api/
│       ├── challenge/           # Challenge API routes
│       └── session/             # Session management
├── components/
│   ├── ui/                      # shadcn/ui components
│   └── challenge/               # Feature-specific components
├── lib/
│   ├── redis.ts                 # Upstash client
│   ├── session.ts               # Session utilities
│   └── challenge/               # Business logic
│       ├── types.ts
│       ├── validation.ts
│       ├── calculator.ts
│       └── repository.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── public/
│   └── icons/                   # PWA icons
├── .env.local                   # Environment variables (gitignored)
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## Testing

### Run Unit Tests

```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # Coverage report
```

### Run E2E Tests

```bash
# Start dev server first
pnpm dev

# In another terminal
pnpm test:e2e          # Headless mode
pnpm test:e2e:ui       # Interactive UI mode
```

**Mobile testing** (Playwright):
```bash
# Test on iPhone 12 Pro viewport
pnpm test:e2e --project=iphone

# Test on Pixel 5 viewport
pnpm test:e2e --project=pixel
```

---

## Mobile Testing

### Test on Real Device (Local Network)

1. Find your local IP:
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr IPv4
```

2. Update `.env.local`:
```bash
NEXT_PUBLIC_APP_URL=http://192.168.1.100:3000  # Your IP
```

3. Start dev server:
```bash
pnpm dev
```

4. On your phone, open `http://192.168.1.100:3000`

### Test via Vercel Preview (Recommended)

```bash
# Install Vercel CLI
pnpm install -g vercel

# Deploy preview
vercel

# Get preview URL (e.g., https://push-track-abc123.vercel.app)
```

Open the preview URL on your mobile device.

---

## Debugging

### Redis Debugging

**Check Redis connection**:
```typescript
// Add to any API route temporarily
import { redis } from '@/lib/redis'

const ping = await redis.ping()
console.log('Redis ping:', ping) // Should log "PONG"
```

**Inspect Redis data**:
```bash
# Install Upstash CLI
npm install -g @upstash/cli

# Login
upstash auth login

# Connect to your database
upstash redis connect --database=push-track-dev

# List all keys
KEYS *

# Get session data
HGETALL session:your-session-id

# Get logs
ZRANGE session:your-session-id:logs 0 -1
```

### Session Cookie Debugging

**Chrome DevTools**:
1. Open DevTools (F12)
2. Application tab → Cookies
3. Check for `session_id` cookie
4. Verify: HttpOnly = ✓, Secure = ✓, SameSite = Strict

**Clear session**:
- DevTools → Application → Cookies → Delete `session_id`
- Or: Open in Incognito/Private window

### Next.js Debugging

**Enable verbose logging**:
```bash
# .env.local
NODE_ENV=development
DEBUG=* # Enable all debug logs
```

**React DevTools**:
```bash
# Install browser extension
# Chrome: https://chrome.google.com/webstore/detail/react-developer-tools/
# Firefox: https://addons.mozilla.org/en-US/firefox/addon/react-devtools/
```

---

## Common Issues

### "Failed to connect to Redis"

**Cause**: Invalid Upstash credentials

**Fix**:
1. Check `.env.local` has correct URL and token
2. Verify Upstash database is active (not paused)
3. Check firewall isn't blocking Upstash domain

### "Session cookie not set"

**Cause**: HTTPS required for Secure cookies

**Fix**:
- Development: Remove `secure: true` from cookie config (dev only!)
- Production: Ensure deployed to HTTPS (Vercel auto-provides)

### "Timezone not detected"

**Cause**: Browser doesn't support Intl API (very old browsers)

**Fix**:
- Fallback to UTC is already implemented
- Recommend modern browser (Chrome 24+, Safari 10+, Firefox 29+)

### "Touch targets too small"

**Cause**: shadcn/ui default sizing

**Fix**:
- All components already adjusted to 44x44px minimum
- If custom component, use `.touch-target` class

### "Chart not rendering"

**Cause**: Missing Chart.js registration or canvas context

**Fix**:
```typescript
// Ensure Chart.js components are registered
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement)
```

---

## Building for Production

### Build Locally

```bash
pnpm build              # Create production build
pnpm start              # Start production server
```

**Build checks**:
- TypeScript type checking
- ESLint validation
- Bundle size analysis

### Deploy to Vercel

```bash
# Install Vercel CLI (if not already)
pnpm install -g vercel

# Deploy to production
vercel --prod
```

**Vercel automatically**:
- Sets environment variables from Vercel dashboard
- Enables HTTPS
- Provides edge functions for API routes
- Optimizes images and fonts

**Environment variables on Vercel**:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Redeploy

---

## Performance Optimization

### Lighthouse Audit (Mobile)

```bash
# Install Lighthouse
npm install -g lighthouse

# Run audit
lighthouse http://localhost:3000 \
  --preset=perf \
  --throttling.rttMs=400 \
  --throttling.throughputKbps=400 \
  --view

# Target scores:
# - Performance: 90+
# - Accessibility: 100
# - Best Practices: 100
# - SEO: 90+
```

### Bundle Size Analysis

```bash
# Add to package.json scripts
"analyze": "ANALYZE=true next build"

# Run
pnpm analyze
```

Opens bundle analyzer at `http://localhost:8888`

**Target bundle sizes**:
- First Load JS: <85KB
- Page-specific JS: <20KB each

---

## Next Steps

After local setup:

1. **Create your first challenge** - Test P1 user story
2. **Log daily pushups** - Test P2 user story with stepper UI
3. **View progress chart** - Test P3 user story with Chart.js
4. **Check mobile responsiveness** - Test on real device or DevTools
5. **Review code structure** - Understand component organization
6. **Read API contracts** - See `contracts/api-routes.md`
7. **Run tests** - Verify everything works

---

## Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Upstash Redis Docs**: https://upstash.com/docs/redis
- **shadcn/ui Components**: https://ui.shadcn.com
- **Chart.js Docs**: https://www.chartjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **React Hook Form**: https://react-hook-form.com
- **Zod Validation**: https://zod.dev

---

## Getting Help

- **GitHub Issues**: https://github.com/bjornallvin/push-track/issues
- **Discussions**: https://github.com/bjornallvin/push-track/discussions
- **Documentation**: See `specs/001-pushup-challenge-app/` directory

---

## License

[Add license information here]
