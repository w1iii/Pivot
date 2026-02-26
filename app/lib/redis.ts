import { createClient } from "redis";

const globalForRedis = global as any;

export const redis =
  globalForRedis.redis ||
  createClient({
    url: process.env.REDIS_URL,
  });

if (!globalForRedis.redis) {
  redis.connect().catch(console.error);
  globalForRedis.redis = redis;
}
