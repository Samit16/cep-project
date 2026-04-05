import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('kjo_token')?.value;
  const path = request.nextUrl.pathname;

  // Extremely basic decode to verify role without full verification (relies on backend API for true safety)
  let role = null;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Also ensure it is not expired
      if (payload.exp && payload.exp * 1000 > Date.now()) {
        role = payload.role;
      }
    } catch {
      // Invalid token
    }
  }

  // Define protected paths
  const isMemberPath = path.startsWith('/directory') || path.startsWith('/profile');
  const isAdminPath = path.startsWith('/dashboard');

  if (!token || !role) {
    if (isMemberPath || isAdminPath) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } else {
    // Has role
    if (isAdminPath && role !== 'admin') {
      return NextResponse.redirect(new URL('/directory', request.url));
    }
    // We don't restrict member paths from admins currently, an admin might have a member profile, 
    // or they can just view it.
    
    // Redirect away from login if already authenticated
    if (path === '/login') {
      return NextResponse.redirect(new URL(role === 'admin' ? '/dashboard' : '/profile', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/directory/:path*',
    '/profile/:path*',
    '/dashboard/:path*',
    '/login'
  ],
};
