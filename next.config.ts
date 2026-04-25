import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  // ─── Security & Cache Headers ───
  async headers() {
    // Security headers applied to every route
    const securityHeaders = [
      // Prevent clickjacking — page cannot be embedded in iframes
      { key: 'X-Frame-Options', value: 'DENY' },
      // Prevent MIME-type sniffing
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      // Control referrer information sent to external sites
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      // Disable unused browser features (camera, mic, geolocation, etc.)
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
      // Force HTTPS for 1 year (enable once deployed with SSL)
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
      // Basic Content Security Policy
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://*.supabase.co",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: blob: https://*.supabase.co https://*.googleusercontent.com",
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com",
          "frame-src https://accounts.google.com https://*.supabase.co",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; '),
      },
    ];

    // No-cache headers for protected routes to prevent BFCache leaking authenticated pages
    const noCacheHeaders = [
      { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
      { key: 'Pragma', value: 'no-cache' },
    ];

    return [
      // Apply security headers globally
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // Also apply no-cache on protected routes
      {
        source: '/directory/:path*',
        headers: noCacheHeaders,
      },
      {
        source: '/dashboard/:path*',
        headers: noCacheHeaders,
      },
      {
        source: '/profile/:path*',
        headers: noCacheHeaders,
      },
    ];
  },

  allowedDevOrigins: ['192.168.1.7', 'localhost', '127.0.0.1'],
};

export default nextConfig;
