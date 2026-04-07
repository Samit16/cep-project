import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('kjo_token')?.value;
  const path = request.nextUrl.pathname;

  // Extremely basic decode to verify role without full verification (relies on backend API for true safety)
  let role = null;
  if (token) {
    try {
      const base64Url = token.split('.')[1];
      let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const pad = base64.length % 4;
      if (pad) {
        if (pad !== 1) {
          base64 += new Array(5 - pad).join('=');
        }
      }
      const payload = JSON.parse(atob(base64));
      // If token has an exp claim, check it isn't expired. If no exp, accept it.
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        // Token is expired — role stays null
      } else {
        role = payload.role || null;
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
    if (isAdminPath && role !== 'admin' && role !== 'committee') {
      return NextResponse.redirect(new URL('/directory', request.url));
    }
    // We don't restrict member paths from admins currently, an admin might have a member profile, 
    // or they can just view it.
    
    // Redirect away from login if already authenticated
    if (path === '/login') {
      return NextResponse.redirect(new URL(role === 'admin' || role === 'committee' ? '/dashboard' : '/directory', request.url));
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
