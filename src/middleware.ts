import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Check Supabase session cookie (set by our auth-context on the client)
  const supabaseToken = request.cookies.get('sb-uevmyvwbmxqreyukbvkq-auth-token')?.value;
  const legacyToken = request.cookies.get('kjo_token')?.value;
  const isAuthenticated = !!(supabaseToken || legacyToken);

  // Define protected paths
  const isMemberPath = path.startsWith('/directory') || path.startsWith('/profile');
  const isAdminPath = path.startsWith('/dashboard');
  const isLoginPath = path === '/login';

  // Not authenticated — block access to protected routes and redirect to login
  if (!isAuthenticated && (isMemberPath || isAdminPath)) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('next', path);
    return NextResponse.redirect(redirectUrl);
  }

  // Authenticated — immediately redirect away from login page (server-side)
  // This is the key fix for showing login page when already logged in
  if (isAuthenticated && isLoginPath) {
    let role = null;
    const token = supabaseToken || legacyToken;
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        if (base64Url) {
          let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const pad = base64.length % 4;
          if (pad && pad !== 1) base64 += new Array(5 - pad).join('=');
          const payload = JSON.parse(atob(base64));
          if (!payload.exp || payload.exp * 1000 > Date.now()) {
            role = payload.role || payload.user_role || null;
          }
        }
      } catch { /* ignore decode errors */ }
    }
    const dest = (role === 'admin' || role === 'committee') ? '/dashboard' : '/directory';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Admin path role check — only for legacy JWTs with explicit role claims
  if (isAuthenticated && isAdminPath && legacyToken && !supabaseToken) {
    let role = null;
    try {
      const base64Url = legacyToken.split('.')[1];
      if (base64Url) {
        let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const pad = base64.length % 4;
        if (pad && pad !== 1) base64 += new Array(5 - pad).join('=');
        const payload = JSON.parse(atob(base64));
        if (!payload.exp || payload.exp * 1000 > Date.now()) {
          role = payload.role || null;
        }
      }
    } catch { /* ignore */ }
    if (role && role !== 'admin' && role !== 'committee') {
      return NextResponse.redirect(new URL('/directory', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/directory/:path*',
    '/profile/:path*',
    '/dashboard/:path*',
    '/login',
  ],
};

