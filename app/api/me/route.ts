import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../lib/auth/jwt'
import pool from '../../lib/db'

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const result = await pool.query(
      'SELECT id, email, firstname, lastname FROM users WHERE id = $1',
      [currentUser.id]
    )

    const user = result.rows[0]
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json({ user })

  } catch {
    return NextResponse.json({ user: null }, { status: 401 })
  }
}
