'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

/**
 * Minimal auth guard. 
 * - On protected pages: redirects to /home if not authenticated.
 * - On protected pages: shows a confirm dialog on back-button press,
 *   and logs out + redirects if user confirms.
 * - NEVER blocks rendering. Children always render immediately.
 */
export function ClientAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isProtected = 
    pathname?.startsWith('/directory') || 
    pathname?.startsWith('/dashboard') || 
    pathname?.startsWith('/profile') ||
    pathname?.startsWith('/archives');

  // Redirect unauthenticated users away from protected pages
  useEffect(() => {
    if (isLoading) return;
    if (isProtected && !user) {
      router.replace('/home');
    }
  }, [user, isLoading, isProtected, router]);



  return <>{children}</>;
}
