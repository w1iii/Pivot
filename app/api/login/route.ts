import { NextRequest, NextResponse } from 'next/server';
import { generateToken, setAuthCookie } from '../../lib/auth/jwt';
import type { User } from '../../lib/auth/jwt';
import pool from '../../lib/db'
import bcrypt from 'bcrypt'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
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

    // Generate JWT token
    const token = await generateToken(user);
    console.log(token)

    // Set cookie
    await setAuthCookie(token);

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
        const query = `SELECT id, password_hash FROM users WHERE email = $1`
        const result = await pool.query(query, [email])

        const user = result.rows[0]
        if (!user) return null

        const isMatch = await bcrypt.compare(password, user.password_hash)

        if(!isMatch) return null
        return user
    }catch(e){
        console.log(e, 'server error')
    }
return null

}
