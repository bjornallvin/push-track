# Push Track

A mobile-first web application for tracking daily pushup progress over a user-defined challenge period.

## Features

- **Create Challenges**: Set a custom duration (1-365 days) for your pushup tracking challenge
- **Daily Logging**: Log your pushup count each day using an intuitive stepper interface
- **Progress Visualization**: View your progress with interactive charts showing daily counts
- **Streak Tracking**: Monitor your consecutive days of non-zero pushup logging
- **Metrics Dashboard**: Track personal bests, completion rates, and total pushups
- **Mobile-First Design**: Optimized for mobile devices with 44x44px touch targets
- **URL-Based Access**: Share your challenge via URL - no authentication required

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.x + shadcn/ui components
- **Charts**: Chart.js 4.x with react-chartjs-2
- **Database**: Redis (standard package)
- **Validation**: Zod + React Hook Form
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18.17.0 or later
- Redis instance (cloud recommended - Railway, Redis Cloud, Upstash)
- Package manager: npm, pnpm, or yarn

**Note**: This project uses the same production Redis instance for both development and production environments.

### Installation

1. Clone the repository:
```bash
git clone https://github.com/bjornallvin/push-track.git
cd push-track
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your Redis connection URL:
```
REDIS_URL=redis://your-production-redis-url:6379
# Example for Railway: redis://default:password@redis.railway.internal:6379
# Example for Redis Cloud: rediss://default:password@redis-12345.c1.us-east-1-1.ec2.cloud.redislabs.com:12345
```

**Important**: This project uses the same production Redis for both development and production. All environments share the same Redis instance.

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Creating a Challenge

1. Click "Start New Challenge" on the home page
2. Enter your desired challenge duration (1-365 days)
3. You'll be redirected to your challenge dashboard with a unique URL

### Logging Daily Pushups

1. Navigate to your challenge dashboard
2. Click "Log Today's Pushups"
3. Use the stepper to set your count (defaults to yesterday's count)
4. Submit to save your log

### Viewing Progress

1. From your dashboard, click "View Progress Chart"
2. See a bar chart with all your logged days
3. Blue bars = logged days, Red bars = missed days (0 pushups)

### Completing or Abandoning

- **Completion**: When you reach the final day, the challenge automatically marks as complete
- **Abandoning**: Click "Abandon Challenge" on your dashboard to delete the challenge

## Project Structure

```
push-track/
├── app/                      # Next.js App Router pages and API routes
│   ├── api/                 # REST API endpoints
│   ├── challenge/           # Challenge pages
│   └── page.tsx             # Home page
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   └── challenge/           # Challenge-specific components
├── lib/                     # Utility functions and business logic
│   ├── challenge/           # Challenge-related logic
│   ├── redis.ts             # Redis client
│   └── utils.ts             # Date utilities and helpers
└── public/                  # Static assets
```

## API Endpoints

- `POST /api/challenge` - Create a new challenge
- `GET /api/challenge/[id]` - Get challenge by ID
- `DELETE /api/challenge/[id]` - Abandon challenge
- `POST /api/challenge/[id]/log` - Log daily pushups
- `GET /api/challenge/[id]/log` - Get all logs

## Development

### Running Tests

```bash
npm run lint
```

### Building for Production

```bash
npm run build
npm start
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add your `REDIS_URL` environment variable
4. Deploy!

### Environment Variables

- `REDIS_URL`: Redis connection string (required)
- `NEXT_PUBLIC_APP_URL`: Your app's URL (optional, defaults to http://localhost:3000)

## Data Storage

- **Redis**: All challenge data is stored in Redis with TTL (Time To Live)
- **TTL**: Challenges expire after (duration + 30 days) for a grace period
- **Keys**: `challenge:{id}`, `challenge:{id}:logs`, `challenge:{id}:metrics`

## Mobile Optimization

- All buttons and interactive elements meet 44x44px minimum touch target size
- Responsive breakpoints: 320px, 375px, 768px, 1024px
- Chart.js configured for touch-friendly interactions
- Server Components used for optimal bundle size

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Charts powered by [Chart.js](https://www.chartjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Made with ❤️ by Björn Allvin**
