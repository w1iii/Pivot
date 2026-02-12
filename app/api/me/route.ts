import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import pool from '../../lib/db'

export async function GET() {
  try {
    // 1️⃣ Get token from cookie
    const storeCookie = await cookies()
    const token = storeCookie.get('token')?.value
    if (!token) {
      console.log("no token")
      return NextResponse.json({ user: null }, { status: 401 })
    }

    // 2️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { user: { id: number }   } 
    console.log(decoded)

    // 3️⃣ Fetch user from DB (safer than trusting token alone)
    const result = await pool.query(
      'SELECT id, email, firstname, lastname FROM users WHERE id = $1',
      [decoded.user.id]
    )
    console.log('Decoded ID:', decoded.user.id)
    console.log('DB rows:', result.rows)

    const user = result.rows[0]
    if (!user) {
      console.log("no accounts found on db")
      return NextResponse.json({ user: null }, { status: 401 })
    }

    // 4️⃣ Return user data
    console.log(" account found ", user)
    return NextResponse.json({ user })

  } catch (error) {
    return NextResponse.json({ user: null }, { status: 401 })
  }
}
