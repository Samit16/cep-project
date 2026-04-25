import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // ─── Rate Limiting for API routes ───
  if (path.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    // Stricter limit for auth endpoints (brute-force protection)
    const isAuthEndpoint = path.startsWith('/api/auth') || path === '/api/members/me';
    const limit = isAuthEndpoint ? 20 : 60;  // requests per window
    const windowMs = 60_000;                 // 1 minute window

    const result = checkRateLimit(`api:${ip}:${isAuthEndpoint ? 'auth' : 'general'}`, limit, windowMs);

    if (!result.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(result.retryAfterMs / 1000)),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // For allowed requests, continue but add rate limit info headers
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(limit));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    return response;
  }

  // ─── Page Route Protection ───
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const projectId = supabaseUrl.match(/https:\/\/(.*?)\.supabase\.co/)?.[1] || 'uevmyvwbmxqreyukbvkq';
  const cookieName = `sb-${projectId}-auth-token`;

  const supabaseToken = request.cookies.get(cookieName)?.value;
  const isAuthenticated = !!supabaseToken;

  const isMemberPath = path.startsWith('/directory') || path.startsWith('/profile') || path.startsWith('/archives');
  const isAdminPath = path.startsWith('/dashboard');
  const isLoginPath = path === '/login';

  // Not authenticated — block access to protected routes
  if (!isAuthenticated && (isMemberPath || isAdminPath)) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('next', path);
    return NextResponse.redirect(redirectUrl);
  }

  // Authenticated — redirect away from login page
  if (isAuthenticated && isLoginPath) {
    let role = null;
    if (supabaseToken) {
      try {
        const base64Url = supabaseToken.split('.')[1];
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

  const response = NextResponse.next();
  
  if (isMemberPath || isAdminPath) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/directory/:path*',
    '/profile/:path*',
    '/dashboard/:path*',
    '/archives/:path*',
    '/login',
  ],
};

