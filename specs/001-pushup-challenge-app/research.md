# Technical Research: Pushup Challenge Tracker

**Date**: 2025-10-18
**Feature**: Mobile-First Pushup Tracking App
**Purpose**: Validate technology choices and establish implementation patterns

---

## 1. Next.js 14 + Upstash Redis Session Management

### Decision: Use @upstash/redis for Edge-Compatible Session Management

**Rationale**:
- Upstash Redis is HTTP/REST based, fully compatible with Vercel Edge Functions
- Traditional Redis requires persistent connections incompatible with serverless
- Built-in TypeScript support and Next.js middleware compatibility

**Implementation**:
```typescript
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})
```

**Alternatives Rejected**:
- Traditional Redis with connection pooling: Incompatible with edge runtime
- In-memory session storage: Not persistent across serverless invocations
- Database-backed sessions: Slower than Redis, overkill for MVP

---

### Session ID Strategy: HttpOnly, Secure Cookies

**Decision**: Use HttpOnly, Secure cookie-based session IDs

**Rationale**:
- HttpOnly prevents XSS access, Secure flag ensures HTTPS-only
- Modern mobile browsers fully support cookies
- No URL pollution, works with bookmarking/sharing
- SameSite protection prevents CSRF

**Implementation**:
```typescript
import { cookies } from 'next/headers'

cookies().set('session_id', sessionId, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 60 * 60 * 24 * 365, // 365 days
  path: '/',
})
```

**Alternatives Rejected**:
- URL-based session IDs: Security risk (leaked in logs, analytics)
- localStorage + custom headers: More complex, no HttpOnly protection
- sessionStorage: Lost when tab closes

**Gotchas**:
- Mobile Safari has aggressive cookie deletion - use long maxAge
- Cookie size limit ~4KB - store only session ID

---

### TTL Strategy: Tiered Approach (30/90/365 Days)

**Decision**: Implement tiered TTL based on activity

**Rationale**:
- Active sessions (last activity < 7 days): 30-day TTL, refreshed on interaction
- Dormant sessions (7-90 days): 90-day TTL, no auto-refresh
- Abandoned sessions (>90 days): 365-day TTL, then auto-delete
- Balances storage costs with user retention

**Implementation**:
```typescript
const ACTIVITY_TIERS = {
  active: 60 * 60 * 24 * 30,     // 30 days
  dormant: 60 * 60 * 24 * 90,    // 90 days
  abandoned: 60 * 60 * 24 * 365, // 365 days
}

async function refreshSessionTTL(sessionId: string, lastActivity: Date) {
  const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)

  let ttl = ACTIVITY_TIERS.abandoned
  if (daysSinceActivity < 7) ttl = ACTIVITY_TIERS.active
  else if (daysSinceActivity < 90) ttl = ACTIVITY_TIERS.dormant

  await redis.expire(`session:${sessionId}`, ttl)
}
```

**Alternatives Rejected**:
- Fixed 365-day TTL: Wastes storage on abandoned sessions
- Aggressive 30-day TTL: Users may lose long-term challenge data
- No expiration: Unbounded storage costs

---

## 2. Mobile-First Performance Patterns

### Bundle Optimization: Server Components by Default

**Decision**: Use Server Components with strategic Client Component boundaries

**Rationale**:
- Server Components send zero JavaScript to client
- Next.js 14 App Router defaults to Server Components
- Keep interactive components minimal and isolated
- Streaming and Suspense built-in for progressive loading

**Implementation**:
```typescript
// app/page.tsx - Server Component (default)
export default async function HomePage() {
  const stats = await getStatsFromRedis()
  return (
    <div>
      <ServerHeader stats={stats} />
      <InteractiveForm /> {/* Client Component */}
    </div>
  )
}

// components/InteractiveForm.tsx
'use client'
import { useState } from 'react'
```

**Client Component Boundaries**:
- ✅ Place 'use client' as low in tree as possible
- ✅ Extract interactive parts into separate client components
- ❌ Don't mark entire pages as 'use client'

---

### CSS Strategy: Per-Route Splitting + Tailwind JIT

**Decision**: Use experimental `cssChunking: 'strict'` with Tailwind CSS

**Rationale**:
- Per-route CSS delivery: Users download only CSS for current route
- Tailwind JIT + purge removes unused styles
- Inline critical CSS eliminates render-blocking

**Implementation**:
```javascript
// next.config.js
module.exports = {
  experimental: {
    cssChunking: 'strict',
    inlineCss: true,
  },
}
```

**Alternatives Rejected**:
- All CSS in one bundle: Large initial download
- Styled-components/Emotion: Adds runtime overhead
- Separate CSS files per component: Too many HTTP requests

---

### FCP Target: <1.5s on 3G Networks

**Decision**: Multi-layered optimization strategy

**Rationale**:
- 3G networks: ~400ms RTT + ~400 Kbps bandwidth
- Every round-trip matters - minimize requests
- Prioritize above-the-fold content

**Performance Budget**:
- HTML: <5KB (first chunk, streamed)
- CSS: <14KB (inlined critical)
- JavaScript: <50KB (initial bundle, gzipped)
- Fonts: <15KB (subset, preloaded)
- **Total initial load: <85KB**

**Implementation**:
```typescript
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://your-redis-domain.upstash.io" />
      </head>
      <body>{children}</body>
    </html>
  )
}

// Streaming with Suspense
export default function Page() {
  return (
    <div>
      <Header />
      <Suspense fallback={<StatsSkeleton />}>
        <StatsComponent />
      </Suspense>
      <Suspense fallback={<ChartSkeleton />}>
        <ChartComponent />
      </Suspense>
    </div>
  )
}
```

---

## 3. Chart Library Selection

### Decision: Chart.js Instead of Recharts

**Rationale**:
- **Recharts has poor mobile support**: Broken touch events on iOS (Issue #444)
- Chart.js has native mobile touch support and responsive design
- Canvas rendering (Chart.js) outperforms SVG (Recharts) on mobile
- Better performance with 365 data points

**Implementation**:
```typescript
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip)

export function PushupChart({ data }: { data: number[] }) {
  return (
    <Bar
      data={{
        labels: data.map((_, i) => `Day ${i + 1}`),
        datasets: [{
          label: 'Pushups',
          data: data,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
        }],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        animation: { duration: 0 }, // Disable for 365 points
      }}
    />
  )
}
```

**Alternatives Rejected**:
- Recharts: Poor mobile touch support
- Apache ECharts: Excellent but large bundle size
- Victory: React Native focused, poor web performance

---

### Responsive Sizing: Container Queries + Fixed Aspect Ratios

**Decision**: Use CSS Container Queries with min/max heights

**Implementation**:
```typescript
export function ChartContainer({ children }) {
  return (
    <div className="w-full min-h-[200px] max-h-[400px] h-[40vh]">
      {children}
    </div>
  )
}
```

---

### Performance with 365 Data Points

**Decision**: Use Chart.js with decimation plugin and lazy loading

**Implementation**:
```typescript
import decimation from 'chartjs-plugin-decimation'
Chart.register(decimation)

const chartOptions = {
  animation: false,
  plugins: {
    decimation: {
      enabled: true,
      algorithm: 'lttb',
      samples: 100,
    },
  },
  parsing: false,
  normalized: true,
}

// Lazy load chart
const PushupChart = dynamic(() => import('@/components/PushupChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
})
```

---

## 4. Date/Timezone Handling

### Timezone Detection: Intl.DateTimeFormat API

**Decision**: Use native Intl.DateTimeFormat API

**Rationale**:
- Native browser API, no dependencies
- Returns IANA timezone string (e.g., "America/New_York")
- Handles DST automatically
- Widely supported (Chrome 24+, Safari 10+, Firefox 29+)

**Implementation**:
```typescript
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch (error) {
    console.error('Failed to detect timezone:', error)
    return 'UTC'
  }
}
```

**Alternatives Rejected**:
- Date.getTimezoneOffset(): Only gives offset, can't distinguish regions
- Moment Timezone: Large bundle (67KB), deprecated
- GeoIP detection: Privacy concerns, less accurate

---

### Day Boundary Calculation: Local Date Strings (YYYY-MM-DD)

**Decision**: Use date-only strings in user's local timezone

**Rationale**:
- Avoid time-of-day entirely - only track which calendar day
- Use local midnight - users expect streak reset at their midnight
- Store UTC timestamps for audit, but compare dates in local timezone

**Implementation**:
```typescript
export function getTodayLocalDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Data structure
interface DailyLog {
  date: string        // "2024-03-15" (local timezone)
  pushups: number
  timestamp: number   // UTC
  timezone: string    // "America/New_York"
}
```

**Alternatives Rejected**:
- Store UTC dates only: Breaks for traveling users
- date-fns/Day.js libraries: Core logic should be simple

---

### Timezone Change Validation: Follow Current Timezone

**Decision**: Track timezone but compare dates in current timezone

**Rationale**:
- Follow the user: If they travel NYC → London, "today" is London's date
- Don't prevent logging in new timezone
- Allow logging for new timezone's "today" even if logged in previous timezone

**Implementation**:
```typescript
export async function canLogToday(sessionId: string): Promise<boolean> {
  const todayLocal = getTodayLocalDate()
  const logs = await redis.get<DailyLog[]>(`session:${sessionId}:logs`)
  if (!logs) return true

  return !logs.some(log => log.date === todayLocal)
}
```

**Edge Cases Handled**:
- User travels from NYC (March 15) to Tokyo (March 16): Can log again ✅
- User crosses date line west: Skips a day, can log for new date ✅
- User crosses date line east: Goes back a day, already logged ❌ (expected)

---

## 5. shadcn/ui Mobile Adaptations

### Touch Target Compliance: Manual 44x44px Enforcement

**Decision**: Manually enforce 44x44px touch targets

**Rationale**:
- WCAG 2.5.5 requires 44x44px minimum
- shadcn/ui does NOT meet this by default (Sheet close button is 16px)
- Built on Radix UI (good foundation) but sizing needs manual adjustment

**Implementation**:
```typescript
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md',
  {
    variants: {
      size: {
        default: 'h-11 px-8 py-2',  // 44px height
        sm: 'h-11 px-3',            // Still 44px
        lg: 'h-14 px-8',
        icon: 'h-11 w-11',          // 44x44px
      },
    },
  }
)

// Global helper
.touch-target {
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

**Alternatives Rejected**:
- Use default sizing: Fails accessibility standards
- Different UI library: shadcn/ui is excellent otherwise

---

### Form Validation: React Hook Form + Zod

**Decision**: Use React Hook Form + Zod with custom stepper

**Rationale**:
- React Hook Form: Industry standard, excellent performance
- Zod validation: Type-safe, runtime validation
- shadcn/ui integration: Built-in Form components
- Custom stepper: Better UX than native number input on mobile

**Implementation**:
```typescript
const formSchema = z.object({
  pushups: z.number()
    .min(0, 'Cannot be negative')
    .max(10000, 'Maximum 10,000 pushups')
    .int('Must be whole number'),
})

export function PushupForm({ defaultValue = 0 }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { pushups: defaultValue },
  })

  const currentValue = form.watch('pushups')

  function increment() {
    form.setValue('pushups', Math.min(currentValue + 1, 10000))
  }

  function decrement() {
    form.setValue('pushups', Math.max(currentValue - 1, 0))
  }

  return (
    <Form {...form}>
      <div className="flex items-center gap-4">
        <Button type="button" size="icon" onClick={decrement}>
          <Minus className="h-4 w-4" />
        </Button>
        <span className="text-4xl font-bold">{currentValue}</span>
        <Button type="button" size="icon" onClick={increment}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <Button type="submit" size="lg" className="w-full">
        Log Pushups
      </Button>
    </Form>
  )
}
```

**Alternatives Rejected**:
- Native `<input type="number">`: Inconsistent mobile keyboard, spinners too small
- Formik: Larger bundle, less TypeScript support

---

### Error Handling: Toast + Sheet Drawer

**Decision**: Use shadcn Toast for transient errors + Sheet for details

**Rationale**:
- Toast: Non-blocking, auto-dismiss, mobile-friendly
- Sheet (drawer): Slides from bottom (native mobile pattern)
- Avoid center modals on mobile: Awkward on small screens

**Implementation**:
```typescript
const { toast } = useToast()

async function onSubmit(values) {
  try {
    const response = await fetch('/api/log', {
      method: 'POST',
      body: JSON.stringify(values),
    })

    if (!response.ok) {
      const error = await response.json()
      toast({
        variant: 'destructive',
        title: 'Error logging pushups',
        description: error.message,
      })
      return
    }

    toast({
      title: 'Pushups logged!',
      description: `${values.pushups} pushups added to your streak.`,
    })
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'Network error',
      description: 'Could not connect to server.',
    })
  }
}
```

**Alternatives Rejected**:
- Alert Dialog (modal): Feels desktop-y on mobile
- Inline errors only: Easy to miss

---

## Summary Decision Matrix

| Decision Point | Recommendation | Key Reason |
|----------------|----------------|------------|
| Session Storage | Upstash Redis | Edge-compatible, serverless |
| Session ID | HttpOnly Cookie | Security, mobile compatibility |
| Session TTL | Tiered (30/90/365 days) | Balance retention & cost |
| JS Bundle | Server Components + dynamic imports | Minimal client JS |
| CSS Strategy | cssChunking + Tailwind | Per-route delivery |
| FCP Target | <1.5s on 3G | Streaming + inlined CSS |
| Chart Library | Chart.js (not Recharts) | Better mobile touch support |
| Chart Performance | Lazy load + decimation | Handle 365 points smoothly |
| Timezone Detection | Intl.DateTimeFormat API | Native, accurate |
| Day Boundary | Local date strings (YYYY-MM-DD) | Avoid timezone math |
| Travel Validation | Follow current timezone | Better UX for travelers |
| Touch Targets | Manual 44x44px enforcement | shadcn/ui doesn't meet default |
| Form Validation | React Hook Form + Zod | Type-safe, performant |
| Error Patterns | Toast + Sheet drawer | Mobile-native patterns |

---

## Next Steps

All technical unknowns have been resolved. Ready to proceed to **Phase 1: Design & Contracts**.
