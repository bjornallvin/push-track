// Load .env BEFORE importing anything else
import { config } from 'dotenv'
import { createClient } from 'redis'

config() // Load environment variables

const CHALLENGE_ID = 'a1fe2044-20d3-4093-8357-dc48b8dff532'

async function fixChallengeData() {
  try {
    const redisURL = process.env.REDIS_URL
    if (!redisURL) {
      throw new Error('REDIS_URL environment variable is not defined')
    }

    const redis = createClient({ url: redisURL })
    await redis.connect()

    console.log('🔧 Fixing challenge data...\n')

    // Update start date to October 15, 2025
    const newStartDate = '2025-10-15'
    await redis.hSet(`challenge:${CHALLENGE_ID}`, 'startDate', newStartDate)
    console.log(`✅ Updated start date to ${newStartDate}`)

    // Clear existing logs
    await redis.del(`challenge:${CHALLENGE_ID}:logs`)
    console.log('✅ Cleared existing logs')

    // Add correct log entries
    const logs = [
      { date: '2025-10-15', pushups: 10 },
      { date: '2025-10-16', pushups: 12 },
      { date: '2025-10-17', pushups: 13 },
    ]

    for (const log of logs) {
      const logEntry = JSON.stringify({
        date: log.date,
        pushups: log.pushups,
        timestamp: new Date(`${log.date}T12:00:00Z`).getTime(),
      })

      // Use date as score for sorted set (YYYYMMDD format)
      const score = parseInt(log.date.replace(/-/g, ''))
      await redis.zAdd(`challenge:${CHALLENGE_ID}:logs`, {
        score,
        value: logEntry,
      })

      console.log(`✅ Added log: ${log.date} - ${log.pushups} pushups`)
    }

    // Recalculate metrics
    const allLogs = await redis.zRange(`challenge:${CHALLENGE_ID}:logs`, 0, -1)
    const parsedLogs = allLogs.map(log => JSON.parse(log))

    // Calculate current day (days since start)
    const startDate = new Date(newStartDate)
    const today = new Date()
    const currentDay = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    // Calculate streak (consecutive non-zero days)
    const sortedLogs = parsedLogs.sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    let streak = 0
    let lastDate: Date | null = null

    for (let i = sortedLogs.length - 1; i >= 0; i--) {
      const log = sortedLogs[i]
      const logDate = new Date(log.date)

      if (log.pushups === 0) break

      if (lastDate === null) {
        streak = 1
        lastDate = logDate
      } else {
        const dayDiff = Math.floor((lastDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24))
        if (dayDiff === 1) {
          streak++
          lastDate = logDate
        } else {
          break
        }
      }
    }

    // Calculate total pushups and personal best
    const totalPushups = parsedLogs.reduce((sum, log) => sum + log.pushups, 0)
    const personalBest = Math.max(...parsedLogs.map(log => log.pushups))

    // Get challenge duration for completion rate
    const challengeData = await redis.hGetAll(`challenge:${CHALLENGE_ID}`)
    const duration = parseInt(challengeData.duration)
    const completionRate = Math.round((parsedLogs.length / duration) * 100)

    // Update metrics
    await redis.hSet(`challenge:${CHALLENGE_ID}:metrics`, {
      currentDay: currentDay.toString(),
      streak: streak.toString(),
      totalPushups: totalPushups.toString(),
      personalBest: personalBest.toString(),
      completionRate: completionRate.toString(),
    })

    console.log('\n📈 Updated metrics:')
    console.log(`   Current Day: ${currentDay}`)
    console.log(`   Streak: ${streak} days`)
    console.log(`   Total Pushups: ${totalPushups}`)
    console.log(`   Personal Best: ${personalBest}`)
    console.log(`   Completion Rate: ${completionRate}%`)

    console.log('\n✅ Challenge data fixed successfully!\n')
    console.log(`🔗 View at: http://localhost:3000/challenge/${CHALLENGE_ID}\n`)

    await redis.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error fixing challenge data:', error)
    process.exit(1)
  }
}

fixChallengeData()
