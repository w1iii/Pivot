// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStorage = await cookies();
  cookieStorage.delete('token');
  cookieStorage.delete('refreshToken');
  
  return NextResponse.json({ 
    success: true, 
    message: 'Logged out successfully' 
  });
}
