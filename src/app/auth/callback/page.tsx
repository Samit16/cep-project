'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, SUPABASE_STORAGE_KEY } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase automatically picks up the tokens from the URL hash
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          router.push('/login?error=auth_failed');
          return;
        }

        if (session) {
          // Explicitly set cookie as a session cookie (no max-age) so it clears on browser close
          document.cookie = `${SUPABASE_STORAGE_KEY}=${session.access_token}; path=/; samesite=lax`;

          // Fetch the user's profile to determine redirect
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, is_first_login')
            .eq('id', session.user.id)
            .single();

          const role = profile?.role;

          // If they connected google, clear the first login flag
          const hasGoogle = session.user.identities?.some((i: any) => i.provider === 'google');
          if (profile?.is_first_login && hasGoogle) {
            await supabase.from('profiles').update({ is_first_login: false }).eq('id', session.user.id);
          }

          const intent = localStorage.getItem('kjo_login_intent');
          localStorage.removeItem('kjo_login_intent');

          if (intent === 'member' && (role === 'committee' || role === 'admin')) {
            // Log out immediately and return to login page
            await supabase.auth.signOut();
            
            if (typeof window !== 'undefined') {
              Object.keys(sessionStorage).filter(k => k.startsWith('sb-')).forEach(k => sessionStorage.removeItem(k));
              Object.keys(localStorage).filter(k => k.startsWith('sb-')).forEach(k => localStorage.removeItem(k));
            }
            document.cookie = `${SUPABASE_STORAGE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; samesite=lax`;
            
            router.replace('/login?tab=committee&error=committee_as_member');
            return;
          }

          if (role === 'admin' || role === 'committee') {
            router.replace('/dashboard');
          } else {
            router.replace('/directory');
          }
        } else {
          router.replace('/login');
        }
      } catch (err) {
        console.error('Callback processing error:', err);
        router.replace('/login?error=callback_failed');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: '1rem',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid #e5e7eb',
        borderTopColor: '#c59a4a',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Completing sign in...</p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
