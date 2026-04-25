'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { User, Lock, Shield, Landmark, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/Toast/ToastProvider';

import { useAuth } from '@/lib/auth-context';
import styles from './LoginPage.module.css';
import { useGsapHeroEntrance } from '@/hooks/useGsapAnimations';

// Inline Google SVG icon to avoid external dependency
const GoogleIcon = () => (
  <svg className={styles.googleIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const FormInput = ({ 
  label, icon: Icon, type, placeholder, value, onChange, disabled, isValid, showPasswordToggle = false, onTogglePassword 
}: any) => {
  const [focused, setFocused] = useState(false);
  const hasInteracted = value.length > 0;
  
  // Dynamic border color based on validation state
  let borderColor = 'var(--color-border)';
  if (focused) borderColor = 'var(--color-primary)';
  else if (hasInteracted && isValid) borderColor = '#16a34a'; // Green success state
  else if (hasInteracted && !isValid) borderColor = '#dc2626'; // Red error state

  return (
    <div className={styles.formGroup} style={{ position: 'relative', marginBottom: '1.5rem' }}>
      <div style={{
        position: 'absolute',
        top: focused || value ? '-10px' : '14px',
        left: '38px',
        background: 'var(--color-bg-card)',
        padding: '0 4px',
        fontSize: focused || value ? '0.75rem' : '0.9375rem',
        color: focused ? 'var(--color-primary)' : 'var(--color-text-muted)',
        transition: 'all 0.2s',
        pointerEvents: 'none',
        zIndex: 2,
        fontWeight: focused || value ? 600 : 400
      }}>
        {label}
      </div>
      <div 
        className={styles.inputWrapper} 
        style={{ 
          borderColor, 
          boxShadow: focused ? '0 0 0 3px rgba(139,26,26,0.1)' : 'none',
          background: hasInteracted && isValid && !focused ? '#f0fdf4' : 'var(--color-bg-input)'
        }}
      >
        <Icon size={18} className={styles.inputIcon} style={{ color: focused ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
        <input
          type={type}
          className={styles.inputField}
          placeholder={focused ? placeholder : ''}
          value={value}
          onChange={onChange}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent' }}
        />
        {showPasswordToggle && (
          <button
            type="button"
            className={styles.passwordToggle}
            onClick={onTogglePassword}
          >
            {type === 'password' ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        )}
      </div>
      {hasInteracted && !isValid && !focused && (
        <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', position: 'absolute' }}>
          {label} is too short.
        </div>
      )}
    </div>
  );
};

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'member' | 'committee'>('member');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { signInWithEmail, signInWithGoogle, token, role, isLoading: authLoading } = useAuth();

  // Redirect if already authenticated (fires once auth check completes)
  useEffect(() => {
    // Check URL for error messages from callback
    const errorParam = searchParams.get('error');
    if (errorParam === 'committee_as_member') {
      toast('You are a committee member. Please log in via Committee Login.', 'warning');
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }

    // Auto-switch tab based on URL param
    const tabParam = searchParams.get('tab');
    if (tabParam === 'committee' || tabParam === 'member') {
      setActiveTab(tabParam);
    }

    if (!authLoading && token) {
      const nextUrl = searchParams.get('next');
      if (nextUrl && nextUrl.startsWith('/')) {
        router.replace(nextUrl);
      } else if (role === 'admin' || role === 'committee') {
        router.replace('/dashboard');
      } else {
        router.replace('/home');
      }
    }
  }, [authLoading, token, router, role, toast, searchParams, activeTab]);

  // Already authenticated — show nothing while redirect fires
  if (!authLoading && token) return null;

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    // Track which login portal they used
    localStorage.setItem('kjo_login_intent', activeTab);
    // mark that OAuth flow was used so we can handle history/back behavior
    localStorage.setItem('kjo_auth_method', 'google');
    try {
      await signInWithGoogle();
      // Redirect is handled by Supabase OAuth flow
    } catch (err: unknown) {
      toast((err as Error).message || 'Google sign-in failed', 'error');
      setIsGoogleLoading(false);
    }
  };

  const handleMemberLogin = async (e?: React.FormEvent | React.KeyboardEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    setLoginError(null);
    if (!username || !password) {
      setLoginError('Please enter your username and password');
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmail(`${username}@kvonagpur.com`, password, 'member');
      toast('Login Successful!', 'success');
      router.replace('/home');
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Invalid credentials';
      setLoginError(msg);
      toast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async (e?: React.FormEvent | React.KeyboardEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    setLoginError(null);
    if (!username || !password) {
      setLoginError('Please enter username and password');
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmail(`${username}@kvonagpur.com`, password, 'committee');
      toast('Login Successful: Welcome back', 'success');
      router.replace('/home');
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Invalid credentials';
      setLoginError(msg);
      toast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const isUsernameValid = username.length >= 3;
  const isPasswordValid = password.length >= 6;

  const formRef = useGsapHeroEntrance<HTMLDivElement>('.gsap-login-anim');

  return (
    <div className={styles.loginPage}>
      <div className={styles.formSide}>
        <div ref={formRef} className={styles.formContainer}>
          {/* Logo Branding */}
          <div className={`gsap-login-anim`} style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo.png"
              alt="KVO Nagpur"
              style={{ height: '64px', width: 'auto', margin: '0 auto', objectFit: 'contain' }}
            />
          </div>
          <h1 className={`${styles.welcomeTitle} gsap-login-anim`}>
            {activeTab === 'committee' ? 'Committee Login' : 'Member Login'}
          </h1>
          <p className={`${styles.welcomeSubtitle} gsap-login-anim`}>Welcome back! Sign in to connect with the community.</p>

          <div className={`${styles.loginCard} gsap-login-anim`}>
            {loginError && (
              <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', border: '1px solid #fca5a5' }}>
                {loginError}
              </div>
            )}

            <div onKeyDown={(e) => { if (e.key === 'Enter') activeTab === 'member' ? handleMemberLogin(e) : handleAdminLogin(e); }}>
              <FormInput 
                label={activeTab === 'committee' ? 'Staff Username' : 'Member Username'}
                icon={activeTab === 'committee' ? Shield : User}
                type="text"
                placeholder={activeTab === 'committee' ? 'admin' : 'first_last'}
                value={username}
                onChange={(e: any) => setUsername(e.target.value)}
                disabled={isLoading}
                isValid={isUsernameValid}
              />

              <FormInput 
                label="Password"
                icon={Lock}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                disabled={isLoading}
                isValid={isPasswordValid}
                showPasswordToggle={true}
                onTogglePassword={() => setShowPassword(prev => !prev)}
              />

              <button
                type="button"
                onClick={activeTab === 'member' ? handleMemberLogin : handleAdminLogin}
                className={styles.submitBtn}
                disabled={isLoading || !isUsernameValid || !isPasswordValid}
                style={{ opacity: (!isUsernameValid || !isPasswordValid) ? 0.6 : 1, transition: 'all 0.2s' }}
              >
                {isLoading ? 'Verifying...' : 'Sign In'}
              </button>

              <div className={styles.divider}>or</div>

              <button
                type="button"
                className={styles.googleBtn}
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isLoading}
                style={{ borderRadius: '8px', padding: '12px', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <GoogleIcon />
                {isGoogleLoading ? 'Redirecting...' : 'Sign in with Google'}
              </button>
            </div>

            <p className={styles.joinText}>
              Not a member? <Link href="/about" className={styles.joinLink}>Learn more</Link>
            </p>
          </div>

          {/* Trust Badges */}
          <div className={`${styles.trustBadges} gsap-login-anim`}>
            <div className={styles.trustBadge}>
              <Shield size={16} className={styles.trustIcon} />
              Secure
            </div>
            <div className={styles.trustBadge}>
              <Lock size={16} className={styles.trustIcon} />
              Private
            </div>
            <div className={styles.trustBadge}>
              <Landmark size={16} className={styles.trustIcon} />
              Community
            </div>
          </div>
        </div>
      </div>

      {/* Visual Identity Side */}
      <div className={styles.imageSide}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/history.png" alt="KVO Nagpur Heritage" className={styles.heritageImage} />
        <div className={styles.imageOverlay}>
          <h2>A Century of Unity</h2>
          <p>Over 100 years of empowering our community globally.</p>
        </div>
      </div>
    </div>
  );
}
