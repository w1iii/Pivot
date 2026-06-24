import { redis } from './redis';

interface RateLimitConfig {
  interval: number;
  maxRequests: number;
}

const defaults: RateLimitConfig = {
  interval: 60,
  maxRequests: 10,
};

export async function rateLimit(
  key: string,
  config: Partial<RateLimitConfig> = {}
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const { interval, maxRequests } = { ...defaults, ...config };
  const redisKey = `ratelimit:${key}`;

  try {
    const current = await redis.incr(redisKey);
    if (current === 1) {
      await redis.expire(redisKey, interval);
    }
    const ttl = await redis.ttl(redisKey);
    return {
      allowed: current <= maxRequests,
      remaining: Math.max(0, maxRequests - current),
      resetIn: ttl > 0 ? ttl : interval,
    };
  } catch (err) {
    console.error('Rate limit check failed (Redis may be down):', err);
    return { allowed: true, remaining: 1, resetIn: interval };
  }
}
