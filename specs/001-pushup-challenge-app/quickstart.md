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
cp .env.example .env
# Edit .env with your Redis connection URL

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

### Redis Instance

Choose one of these options:

**Option 1: Local Redis (Development)**
```bash
# macOS (using Homebrew)
brew install redis
brew services start redis

# Linux (Ubuntu/Debian)
sudo apt install redis-server
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:7-alpine
```

**Option 2: Cloud Redis (Production/Testing)**
- Railway: https://railway.app (free tier available)
- Redis Cloud: https://redis.com/try-free (free tier: 30MB)
- Upstash: https://upstash.com (serverless, pay-as-you-go)

**Connection URL format**: `redis://localhost:6379` (local) or provided by cloud service

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
- TypeScript 5.x
- Tailwind CSS 3.x
- shadcn/ui components
- Chart.js + react-chartjs-2
- Redis (redis npm package)
- Zod (validation)
- React Hook Form

---

## Environment Setup

### Create `.env`

```bash
cp .env.example .env
```

### Add Redis Credentials

Edit `.env`:

```bash
# Redis Connection
REDIS_URL=redis://localhost:6379

# Or for cloud Redis (example from Railway)
# REDIS_URL=redis://default:password@redis.railway.internal:6379

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Vercel Analytics (production only)
# NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
```

**Connection URL formats**:
- **Local**: `redis://localhost:6379`
- **With password**: `redis://default:password@host:6379`
- **TLS**: `rediss://default:password@host:6380` (note the double 's')
- **Cloud provider**: Use the connection URL provided by your service

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
│   ├── redis.ts                 # Redis client
│   └── challenge/               # Business logic
│       ├── types.ts
│       ├── validation.ts
│       ├── calculator.ts
│       └── repository.ts
├── public/
│   └── icons/                   # PWA icons
├── .env                         # Environment variables (gitignored)
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

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
# Connect to Redis CLI
redis-cli

# Or for remote Redis
redis-cli -u redis://your-host:6379

# List all keys
KEYS *

# Get session data
HGETALL session:your-session-id

# Get logs
ZRANGE session:your-session-id:logs 0 -1

# Monitor all commands (useful for debugging)
MONITOR

# Exit
exit
```

### URL-Based Challenge Access

**How authentication works**:
- Each challenge has a unique UUID in the URL (e.g., `/challenge/abc123-def456`)
- The URL is the authentication token - bookmark it to access your challenge
- No cookies or sessions needed

**Testing different challenges**:
- Open different URLs in different tabs or browsers
- Each URL represents a separate challenge
- Share URLs to let others view (but they can also modify)

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

**Cause**: Invalid Redis URL or Redis not running

**Fix**:
1. Check `.env` has correct `REDIS_URL`
2. Verify Redis is running: `redis-cli ping` (should return PONG)
3. For local: `brew services start redis` or `docker ps` to check container
4. For cloud: Check dashboard for connection issues
5. Check firewall isn't blocking Redis port (6379)

### "Challenge not found"

**Cause**: Invalid challenge ID or challenge expired (TTL passed)

**Fix**:
1. Check the URL has a valid UUID format
2. Check if challenge expired (duration + 30 days grace period)
3. Create a new challenge if the old one expired
4. Use redis-cli to check: `EXISTS challenge:{challengeId}`

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
- Provides serverless functions for API routes
- Optimizes images and fonts

**Environment variables on Vercel**:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - `REDIS_URL` (your cloud Redis connection URL)
3. Redeploy

**Note**: For production, use a cloud Redis provider (Railway, Redis Cloud, etc.) as Vercel serverless functions don't support persistent local Redis.

---

## Next Steps

After local setup:

1. **Create your first challenge**
2. **Log daily pushups** - Use the stepper UI
3. **View progress chart** - See Chart.js visualization
4. **Check mobile responsiveness** - Try on real device or DevTools
5. **Review code structure** - Understand component organization
6. **Read API contracts** - See `contracts/api-routes.md`

---

## Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Redis Docs**: https://redis.io/docs
- **node-redis Client**: https://github.com/redis/node-redis
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
