// middleware.ts (in root directory)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export function middleware(request: NextRequest) {
  // Only protect the main dashboard route and HR management routes
  if (request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/api/hr-')) {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      // Verify the JWT token
      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET not set');
        return NextResponse.redirect(new URL('/login', request.url));
      }

      jwt.verify(token, process.env.JWT_SECRET);
      
      // Token is valid, allow request to continue
      return NextResponse.next();
      
    } catch (error) {
      console.error('Token verification failed:', error);
      
      // Clear invalid token and redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth-token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/api/hr-users/:path*'
  ]
}