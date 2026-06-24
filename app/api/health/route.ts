import { NextResponse } from 'next/server';
import pool from '../../lib/db';
import { redis } from '../../lib/redis';

export async function GET() {
  const checks: Record<string, string> = {};
  let healthy = true;

  try {
    await pool.query('SELECT 1');
    checks.database = 'ok';
  } catch (err) {
    console.error('Health check - database error:', err);
    checks.database = 'error';
    healthy = false;
  }

  try {
    await redis.ping();
    checks.redis = 'ok';
  } catch (err) {
    console.error('Health check - Redis error:', err);
    checks.redis = 'error';
    healthy = false;
  }

  return NextResponse.json(
    { status: healthy ? 'healthy' : 'unhealthy', checks },
    { status: healthy ? 200 : 503 }
  );
}
