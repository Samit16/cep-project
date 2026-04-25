import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Extract project ID from env to match the cookie name
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const projectId = supabaseUrl.match(/https:\/\/(.*?)\.supabase\.co/)?.[1] || 'uevmyvwbmxqreyukbvkq';
  const cookieName = `sb-${projectId}-auth-token`;

  // Check Supabase session cookie (set by our auth-context on the client)
  const supabaseToken = request.cookies.get(cookieName)?.value;
  const isAuthenticated = !!supabaseToken;

  // Define protected paths
  const isMemberPath = path.startsWith('/directory') || path.startsWith('/profile') || path.startsWith('/archives');
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
    '/directory/:path*',
    '/profile/:path*',
    '/dashboard/:path*',
    '/archives/:path*',
    '/login',
  ],
};

