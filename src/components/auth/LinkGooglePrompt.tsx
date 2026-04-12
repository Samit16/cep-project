'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import styles from './LoginPage.module.css'; // Re-use styling variables
import { Shield, Mail, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast/ToastProvider';

export default function LinkGooglePrompt({ onDismiss }: { onDismiss?: () => void }) {
  const { profile, user, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  // If there's no user, or profile doesn't require first-time setup, render nothing
  if (!user || !profile || !profile.is_first_login) return null;

  // Check if they already have a google identity linked
  const hasGoogleLinked = user.identities?.some(i => i.provider === 'google');
  if (hasGoogleLinked) return null;

  const handleLink = async () => {
    setLoading(true);
    try {
      // In Supabase, linking an identity requires a special hook or redirecting
      // Normally, signInWithOAuth when already logged in automatically links the account!
      await signInWithGoogle();
    } catch (err: unknown) {
      toast((err as Error).message || 'Failed to initialize Google linking', 'error');
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      background: '#fff',
      padding: '24px',
      borderRadius: '16px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
      zIndex: 9999,
      maxWidth: '380px',
      borderLeft: '4px solid var(--color-primary)'
    }}>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
        >
          <X size={16} />
        </button>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div style={{ background: '#fdf2f2', padding: '8px', borderRadius: '8px', color: 'var(--color-primary)' }}>
          <Shield size={20} />
        </div>
        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text-primary)' }}>Secure Your Account</h3>
      </div>
      
      <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
        Welcome back! You logged in via a generated credential. To ensure you never lose access, please link your Google Account now. Next time, just click "Sign in with Google"!
      </p>

      <button
        onClick={handleLink}
        disabled={loading}
        className={styles.googleBtn}
        style={{ width: '100%', justifyContent: 'center' }}
      >
        <Mail size={16} style={{ marginRight: '8px' }} />
        {loading ? 'Redirecting...' : 'Connect Google Email'}
      </button>
    </div>
  );
}
