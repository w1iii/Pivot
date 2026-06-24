import { createClient, RedisClientType } from "redis";

const globalForRedis = globalThis as unknown as {
  redis?: RedisClientType | null;
  redisConnected?: boolean;
};

let client: RedisClientType | null = null;
let connected = false;

async function ensureConnected(): Promise<boolean> {
  if (connected && client) return true;
  if (client === null) {
    const url = process.env.REDIS_URL || '';
    if (!url) return false;
    client = createClient({
      url,
      socket: {
        reconnectStrategy: () => false, // don't retry
        connectTimeout: 5000,
      },
    });
    client.on('error', () => {});
  }
  try {
    await client.connect();
    connected = true;
    return true;
  } catch {
    client = null;
    return false;
  }
}

export const redis = {
  async get(key: string): Promise<string | null> {
    if (!(await ensureConnected())) return null;
    try { return await client!.get(key); } catch { return null; }
  },
  async set(key: string, value: string, opts?: { EX?: number }): Promise<void> {
    if (!(await ensureConnected())) return;
    try { await client!.set(key, value, opts); } catch { /* skip */ }
  },
  async del(key: string): Promise<void> {
    if (!(await ensureConnected())) return;
    try { await client!.del(key); } catch { /* skip */ }
  },
  async incr(key: string): Promise<number> {
    if (!(await ensureConnected())) return 1;
    try { return await client!.incr(key); } catch { return 1; }
  },
  async expire(key: string, seconds: number): Promise<void> {
    if (!(await ensureConnected())) return;
    try { await client!.expire(key, seconds); } catch { /* skip */ }
  },
  async ttl(key: string): Promise<number> {
    if (!(await ensureConnected())) return -1;
    try { return await client!.ttl(key); } catch { return -1; }
  },
  async ping(): Promise<string> {
    if (!(await ensureConnected())) return 'NO_REDIS';
    try { return await client!.ping(); } catch { return 'NO_REDIS'; }
  },
};
