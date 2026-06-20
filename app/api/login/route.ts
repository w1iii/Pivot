import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '../../lib/auth/jwt';
import type { User } from '../../lib/auth/jwt';
import pool from '../../lib/db'
import bcrypt from 'bcrypt'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await authenticateUser(email, password);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = await generateToken(user);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response


  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}

async function authenticateUser(email: string, password: string): Promise<User | null> {
    try{
        const query = `SELECT id, email, password_hash FROM users WHERE email = $1`
        const result = await pool.query(query, [email])

        const row = result.rows[0]
        if (!row) return null

        const isMatch = await bcrypt.compare(password, row.password_hash)

        if(!isMatch) return null
        return { id: row.id, email: row.email }
    }catch(e){
        console.log(e, 'server error')
    }
return null

}
