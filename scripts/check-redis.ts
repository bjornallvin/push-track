// Load .env BEFORE importing anything else
import { config } from 'dotenv'
import { createClient } from 'redis'

config() // Load environment variables

async function checkRedis() {
  try {
    const redisURL = process.env.REDIS_URL
    if (!redisURL) {
      throw new Error('REDIS_URL environment variable is not defined')
    }

    const redis = createClient({ url: redisURL })
    await redis.connect()

    console.log('🔍 Checking Redis for challenges...\n')

    // Get all challenge keys
    const keys = await redis.keys('challenge:*')

    if (keys.length === 0) {
      console.log('❌ No challenges found in Redis')
      await redis.disconnect()
      process.exit(0)
    }

    console.log(`✅ Found ${keys.length} challenge-related keys:\n`)

    // Group by challenge ID
    const challengeIds = new Set<string>()
    keys.forEach(key => {
      const match = key.match(/^challenge:([^:]+)/)
      if (match) {
        challengeIds.add(match[1])
      }
    })

    console.log(`📊 Active challenges: ${challengeIds.size}\n`)

    // Inspect each challenge
    for (const id of challengeIds) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`Challenge ID: ${id}`)
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

      // Get challenge data
      const challengeData = await redis.hGetAll(`challenge:${id}`)
      if (Object.keys(challengeData).length > 0) {
        console.log('📋 Challenge Details:')
        console.log(`   Duration: ${challengeData.duration} days`)
        console.log(`   Start Date: ${challengeData.startDate}`)
        console.log(`   Status: ${challengeData.status}`)
        console.log(`   Timezone: ${challengeData.timezone}`)
        console.log(`   Created: ${new Date(parseInt(challengeData.createdAt)).toLocaleString()}`)
      }

      // Get logs count
      const logsCount = await redis.zCard(`challenge:${id}:logs`)
      console.log(`\n📝 Logs: ${logsCount} days logged`)

      // Get recent logs
      if (logsCount > 0) {
        const recentLogs = await redis.zRange(`challenge:${id}:logs`, -5, -1)
        console.log(`\n   Recent logs:`)
        recentLogs.forEach((log) => {
          const parsed = JSON.parse(log)
          console.log(`   • ${parsed.date}: ${parsed.pushups} pushups`)
        })
      }

      // Get metrics
      const metrics = await redis.hGetAll(`challenge:${id}:metrics`)
      if (Object.keys(metrics).length > 0) {
        console.log(`\n📈 Metrics:`)
        console.log(`   Current Day: ${metrics.currentDay}`)
        console.log(`   Streak: ${metrics.streak} days`)
        console.log(`   Personal Best: ${metrics.personalBest}`)
        console.log(`   Total Pushups: ${metrics.totalPushups}`)
        console.log(`   Completion Rate: ${metrics.completionRate}%`)
      }

      // Get TTL
      const ttl = await redis.ttl(`challenge:${id}`)
      if (ttl > 0) {
        const days = Math.floor(ttl / 86400)
        console.log(`\n⏰ Expires in: ${days} days`)
      }

      console.log(`\n🔗 Dashboard URL: http://localhost:3000/challenge/${id}`)
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    await redis.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error connecting to Redis:', error)
    process.exit(1)
  }
}

checkRedis()
