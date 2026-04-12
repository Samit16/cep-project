import type { NextConfig } from "next";

const nextConfig: NextConfig = {


  // Prevent protected pages from being cached in browser BFCache or CDN caches.
  // When a user presses forward to /directory after logout,
  // the browser makes a fresh HTTP request which the middleware intercepts.
  async headers() {
    return [
      {
        source: '/directory/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
      {
        source: '/dashboard/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
      {
        source: '/profile/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
    ];
  },

  allowedDevOrigins: ['192.168.1.7', 'localhost', '127.0.0.1'],
};

export default nextConfig;
