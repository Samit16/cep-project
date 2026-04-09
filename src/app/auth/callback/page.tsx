'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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
          document.cookie = `sb-uevmyvwbmxqreyukbvkq-auth-token=${session.access_token}; path=/; samesite=lax`;

          // Fetch the user's profile to determine redirect
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          const role = profile?.role;
          
          const intent = localStorage.getItem('kjo_login_intent');
          localStorage.removeItem('kjo_login_intent');

          if (intent === 'member' && (role === 'committee' || role === 'admin')) {
            // Log out immediately and return to login page
            await supabase.auth.signOut();
            document.cookie = 'sb-uevmyvwbmxqreyukbvkq-auth-token=; path=/; max-age=0;';
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
