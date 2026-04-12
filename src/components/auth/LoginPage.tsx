'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { User, Lock, Shield, Landmark, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/Toast/ToastProvider';

import { useAuth } from '@/lib/auth-context';
import styles from './LoginPage.module.css';

// Inline Google SVG icon to avoid external dependency
const GoogleIcon = () => (
  <svg className={styles.googleIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

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
      router.replace('/home');
    }
  }, [authLoading, token, router, role, toast, searchParams, activeTab]);

  // Already authenticated — show nothing while redirect fires
  if (!authLoading && token) return null;

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    // Track which login portal they used
    localStorage.setItem('kjo_login_intent', activeTab);
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

  return (
    <div className={styles.loginPage}>
      <div className={styles.formSide}>
        <div className={styles.formContainer}>
          <h1 className={styles.welcomeTitle}>
            {activeTab === 'committee' ? 'Committee Login' : 'Member Login'}
          </h1>
          <p className={styles.welcomeSubtitle}>Preserving Heritage, Building Future.</p>

          <div className={styles.loginCard}>
            {loginError && (
              <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', border: '1px solid #fca5a5' }}>
                {loginError}
              </div>
            )}

            {/* Conditional Form Rendering */}
            {activeTab === 'member' ? (
              <div onKeyDown={(e) => { if (e.key === 'Enter') handleMemberLogin(e); }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Member Username</label>
                  <div className={styles.inputWrapper}>
                    <User size={18} className={styles.inputIcon} />
                    <input
                      type="text"
                      className={styles.inputField}
                      placeholder="first_last"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Password</label>
                  <div className={styles.inputWrapper}>
                    <Lock size={18} className={styles.inputIcon} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={styles.inputField}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      aria-label="Password"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowPassword(prev => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      tabIndex={0}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleMemberLogin}
                  className={styles.submitBtn}
                  disabled={isLoading || !username || !password}
                >
                  {isLoading ? 'Verifying...' : 'Sign In'}
                </button>

                <div className={styles.divider}>or</div>

                <button
                  type="button"
                  className={styles.googleBtn}
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading || isLoading}
                  id="google-signin-btn"
                >
                  <GoogleIcon />
                  {isGoogleLoading ? 'Redirecting...' : 'Sign in with Google'}
                </button>
              </div>
            ) : (
              <div onKeyDown={(e) => { if (e.key === 'Enter') handleAdminLogin(e); }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Staff Username</label>
                  <div className={styles.inputWrapper}>
                    <Shield size={18} className={styles.inputIcon} />
                    <input
                      type="text"
                      className={styles.inputField}
                      placeholder="admin"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Password</label>
                  <div className={styles.inputWrapper}>
                    <Lock size={18} className={styles.inputIcon} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={styles.inputField}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      aria-label="Password"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowPassword(prev => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      tabIndex={0}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAdminLogin}
                  className={styles.submitBtn}
                  disabled={isLoading || !username || !password}
                >
                  {isLoading ? 'Verifying...' : 'Sign In'}
                </button>

                <div className={styles.divider}>or</div>

                <button
                  type="button"
                  className={styles.googleBtn}
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading || isLoading}
                  id="google-signin-btn-admin"
                >
                  <GoogleIcon />
                  {isGoogleLoading ? 'Redirecting...' : 'Sign in with Google'}
                </button>
              </div>
            )}

            <p className={styles.joinText}>
              Not a member? <Link href="/about" className={styles.joinLink}>Learn more</Link>
            </p>
          </div>

          {/* Trust Badges */}
          <div className={styles.trustBadges}>
            <div className={styles.trustBadge}>
              <Shield size={16} className={styles.trustIcon} />
              Secure Access
            </div>
            <div className={styles.trustBadge}>
              <Lock size={16} className={styles.trustIcon} />
              Privacy First
            </div>
            <div className={styles.trustBadge}>
              <Landmark size={16} className={styles.trustIcon} />
              Official Portal
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
