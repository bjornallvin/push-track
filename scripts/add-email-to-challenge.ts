// Load .env BEFORE importing anything else
import { config } from 'dotenv'
import { createClient } from 'redis'

config() // Load environment variables

const CHALLENGE_ID = 'a1fe2044-20d3-4093-8357-dc48b8dff532'
const EMAIL = 'bjorn@allvin.se'

async function addEmailToChallenge() {
  try {
    const redisURL = process.env.REDIS_URL
    if (!redisURL) {
      throw new Error('REDIS_URL environment variable is not defined')
    }

    const redis = createClient({ url: redisURL })
    await redis.connect()

    console.log(`🔧 Adding email to challenge ${CHALLENGE_ID}...\n`)

    // Add email to the challenge
    await redis.hSet(`challenge:${CHALLENGE_ID}`, 'email', EMAIL)

    console.log(`✅ Email added successfully!`)
    console.log(`   Challenge ID: ${CHALLENGE_ID}`)
    console.log(`   Email: ${EMAIL}`)

    // Verify by getting the challenge data
    const challengeData = await redis.hGetAll(`challenge:${CHALLENGE_ID}`)
    console.log(`\n📋 Updated Challenge Data:`)
    console.log(`   Duration: ${challengeData.duration} days`)
    console.log(`   Start Date: ${challengeData.startDate}`)
    console.log(`   Email: ${challengeData.email}`)

    await redis.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

addEmailToChallenge()
