import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    // Stricter limit for auth endpoints (brute-force protection)
    const isAuthEndpoint = path.startsWith('/api/auth');
    const limit = isAuthEndpoint ? 5 : 60;
    const windowMs = isAuthEndpoint ? 15 * 60_000 : 60_000;
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
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(limit));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    return response;
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const projectId = supabaseUrl.match(/https:\/\/(.*?)\.supabase\.co/)?.[1] || '';
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