import { createClient } from 'redis'

const redisURL = process.env.REDIS_URL

if (!redisURL) {
  throw new Error('REDIS_URL environment variable is not defined')
}

// Create Redis client singleton
const redisClient = createClient({
  url: redisURL,
})

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err)
})

redisClient.on('connect', () => {
  console.log('Redis Client Connected')
})

// Connect to Redis
let isConnecting = false
let isConnected = false

async function connectRedis() {
  if (isConnected) return redisClient
  if (isConnecting) {
    // Wait for connection to complete
    while (isConnecting) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    return redisClient
  }

  isConnecting = true
  try {
    await redisClient.connect()
    isConnected = true
  } catch (error) {
    console.error('Failed to connect to Redis:', error)
    throw error
  } finally {
    isConnecting = false
  }

  return redisClient
}

// Get Redis client (ensures connection)
export async function getRedis() {
  if (!isConnected) {
    await connectRedis()
  }
  return redisClient
}

// Export client for direct use (use getRedis() instead in most cases)
export { redisClient as redis }
