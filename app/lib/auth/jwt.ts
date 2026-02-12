import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

// Define your user type
export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface JWTPayload {
  user: User;
  exp: number;
  iat: number;
}

// Get secret from environment variable
const getSecretKey = (): Uint8Array => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set in environment variables');
  }
  return new TextEncoder().encode(secret);
};

const TOKEN_NAME = 'auth-token';
const TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Generate a JWT token for a user
 */
export async function generateToken(user: User): Promise<string> {
  const secret = getSecretKey();
  
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Token expires in 7 days
    .sign(secret);

  return token;
}

/**
 * Verify a JWT token and return the payload
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);
    
    return payload as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Get the current user from the request cookies
 */
export async function getCurrentUser(request?: NextRequest): Promise<User | null> {
  try {
    let token: string | undefined;

    if (request) {
      // Get token from request cookies (for middleware)
      token = request.cookies.get(TOKEN_NAME)?.value;
    } else {
      // Get token from Next.js cookies (for server components/route handlers)
      const cookieStore = await cookies();
      token = cookieStore.get(TOKEN_NAME)?.value;
    }

    if (!token) {
      return null;
    }

    const payload = await verifyToken(token);
    return payload?.user || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Set auth token in cookies
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TOKEN_MAX_AGE,
    path: '/',
  });
}

/**
 * Remove auth token from cookies
 */
export async function removeAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_NAME);
}
