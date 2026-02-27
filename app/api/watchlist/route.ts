import { NextResponse } from 'next/server';
import pool from '../../lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { redis } from "../../lib/redis";

const DEFAULT_EXPIRATION = 3600

async function getUserId(): Promise<string | null>{
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { user: { id: string }};
    return decoded.user.id;
  } catch {
    return null;
  }
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cacheKey = `watchlist:${userId}`;

  try{
    const cachedData = await redis.get(cacheKey);
    if(cachedData){
      console.log("Serving from Redis cache");
      return NextResponse.json(JSON.parse(cachedData));
    }

    console.log("Fetching data from DB")

    const result = await pool.query(
      'SELECT symbol FROM watchlist WHERE user_id = $1 ORDER BY added_at ASC',
      [userId]
    );

    console.log("query result: ", result.rows)

    await redis.set(cacheKey, JSON.stringify(result.rows),{
      EX: DEFAULT_EXPIRATION,
    });


    return NextResponse.json(result.rows);

  }catch(e){
    console.log(e)
    return NextResponse.json({
      error: "Failed to get data from database. Server Error",
    }, {status: 500 })

    }
  }

export async function POST(req: Request) {
  const userId = await getUserId();

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { symbol } = await req.json();
  // upper case the symbol to avoid duplicate because symbols are uppercased
  const upperSymbol = symbol.toUpperCase();
  const cacheKey = `watchlist:${userId}`;

  try{
    const result = await pool.query(
      'INSERT INTO watchlist (user_id, symbol) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, symbol.toUpperCase()]
    );
    
    // if duplicate return success directly
    if (result.rowCount === 0) {
      return NextResponse.json({ success: true });
    }

    const cached = await redis.get(cacheKey);
    if (cached) {
      const watchlist = JSON.parse(cached);

      // check symbol if already exist on the cached data
      const exists = watchlist.some(
        (item: { symbol: string }) => item.symbol === upperSymbol
      );

      // if doesn't exist push the data on the watchlist cached db
      if (!exists) {
        watchlist.push({ symbol: upperSymbol });

        await redis.set(cacheKey, JSON.stringify(watchlist), {
          EX: DEFAULT_EXPIRATION,
        });
      }
    }

    return NextResponse.json({ success: true });

  }catch(e){
    console.log(e)
    return NextResponse.json({ error: "Server Error" }, {status: 500})
  }
}

export async function DELETE(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { symbol } = await req.json();
  const upperSymbol = symbol.toUpperCase();
  const cacheKey = `watchlist:${userId}`;

  try{
    await pool.query(
      'DELETE FROM watchlist WHERE user_id = $1 AND symbol = $2',
      [userId, upperSymbol] 
    );

    const cached = await redis.get(cacheKey);

    if (cached) {
      const watchlist = JSON.parse(cached);

      // check if symbol in the watchlist if true filter out symbol
      const updated = watchlist.filter(
        (item: { symbol: string }) => item.symbol !== upperSymbol
      );
      console.log("Removed data from Redis cache")

      await redis.set(cacheKey, JSON.stringify(updated), {
        EX: DEFAULT_EXPIRATION,
      });
    }

    return NextResponse.json({ success: true });
  }catch(e){
    console.log(e)
    return NextResponse.json({ error: "Server Error" }, {status: 500})
  }
}
