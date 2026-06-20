import { createClient } from "redis";

const globalForRedis = globalThis as unknown as { redis?: ReturnType<typeof createClient> };

function createRedisClient() {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  const client = createClient({
    url,
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
      connectTimeout: 10000,
    },
  });

  client.on('error', (err) => {
    console.error('Redis client error:', err);
  });

  return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (!globalForRedis.redis) {
  redis.connect().catch((err) => {
    console.error('Redis connection failed:', err.message);
  });
  globalForRedis.redis = redis;
}
