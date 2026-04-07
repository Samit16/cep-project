'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Lock, Shield, Landmark } from 'lucide-react';
import { useToast } from '@/components/ui/Toast/ToastProvider';
import { ApiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'member' | 'committee'>('member');
  const [contactNo, setContactNo] = useState('');
  const [otp, setOtp] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactNo) {
      toast('Please enter your registered mobile number', 'error');
      return;
    }

    setIsLoading(true);
    try {
      if (!otpSent) {
        // Request OTP
        const res = await ApiClient.post<{ message: string; dev_otp?: string }>('/auth/otp/request', { contact_no: contactNo });
        setOtpSent(true);
        toast('OTP Sent!', 'success');
      } else {
        // Verify OTP
        const res = await ApiClient.post<{ token: string }>('/auth/otp/verify', { contact_no: contactNo, otp });
        login(res.token, { sub: contactNo, role: 'member' });
        toast('Login Successful!', 'success');
        router.push('/directory');
      }
    } catch (err: any) {
      toast(err.message || 'Authentication failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast('Please enter username and password', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await ApiClient.post<{ token: string }>('/auth/admin/login', { username, password });
      login(res.token); // Let the auth context decode the role from the token
      toast('Login Successful: Welcome back', 'success');
      router.push('/dashboard');
    } catch (err: any) {
      toast(err.message || 'Invalid credentials', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.formSide}>
        <div className={styles.formContainer}>
          <h1 className={styles.welcomeTitle}>Welcome Back</h1>
          <p className={styles.welcomeSubtitle}>Preserving Heritage, Building Future.</p>

          <div className={styles.loginCard}>
            {/* Tab Toggle */}
            <div className={styles.tabToggle}>
              <button
                type="button"
                className={`${styles.tab} ${activeTab === 'member' ? styles.tabActive : ''}`}
                onClick={() => { setActiveTab('member'); setOtpSent(false); setOtp(''); }}
              >
                Member Login
              </button>
              <button
                type="button"
                className={`${styles.tab} ${activeTab === 'committee' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('committee')}
              >
                Committee Login
              </button>
            </div>

            {/* Forms */}
            {activeTab === 'member' ? (
              <form onSubmit={handleMemberLogin}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Mobile Number</label>
                  <div className={styles.inputWrapper}>
                    <User size={18} className={styles.inputIcon} />
                    <input
                      type="text"
                      className={styles.inputField}
                      placeholder="+919999999999"
                      value={contactNo}
                      onChange={(e) => setContactNo(e.target.value)}
                      disabled={otpSent || isLoading}
                    />
                  </div>
                </div>

                {otpSent && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Enter OTP</label>
                    <div className={styles.inputWrapper}>
                      <Lock size={18} className={styles.inputIcon} />
                      <input
                        type="text"
                        className={styles.inputField}
                        placeholder="6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                )}

                <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                  {isLoading ? 'Processing...' : otpSent ? 'Verify & Access Account' : 'Request OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleAdminLogin}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Username</label>
                  <div className={styles.inputWrapper}>
                    <User size={18} className={styles.inputIcon} />
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
                      type="password"
                      className={styles.inputField}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                  {isLoading ? 'Processing...' : 'Secure Login'}
                </button>
              </form>
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
        <img src="/images/history.png" alt="KVO Nagpur Heritage" className={styles.heritageImage} />
        <div className={styles.imageOverlay}>
          <h2>A Century of Unity</h2>
          <p>Over 100 years of empowering our community globally.</p>
        </div>
      </div>
    </div>
  );
}
