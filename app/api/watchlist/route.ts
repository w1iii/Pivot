import { NextResponse } from 'next/server';
import pool from '../../lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';



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

  const result = await pool.query(
    'SELECT symbol FROM watchlist WHERE user_id = $1 ORDER BY added_at ASC',
    [userId]
  );

  return NextResponse.json(result.rows);
}

export async function POST(req: Request) {
  const userId = await getUserId();

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { symbol } = await req.json();
  try{
    await pool.query(
      'INSERT INTO watchlist (user_id, symbol) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, symbol.toUpperCase()]
    );

    return NextResponse.json({ success: true });

  }catch(e){
    console.log(e)
    return NextResponse.json({ e })
  }

}

export async function DELETE(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { symbol } = await req.json();
  await pool.query(
    'DELETE FROM watchlist WHERE user_id = $1 AND symbol = $2',
    [userId, symbol.toUpperCase()]
  );
  return NextResponse.json({ success: true });
}
