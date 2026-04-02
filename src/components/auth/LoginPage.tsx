'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, Shield, Landmark } from 'lucide-react';
import { useToast } from '@/components/ui/Toast/ToastProvider';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'member' | 'committee'>('member');
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'committee') {
      localStorage.setItem('kjo_simulated_auth', 'committee');
      toast('Login Successful: Welcome back to the Committee Dashboard', 'success');
      router.push('/dashboard');
    } else {
      localStorage.setItem('kjo_simulated_auth', 'member');
      toast('Login Successful: Welcome to Member Portal', 'success');
      router.push('/directory');
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
                className={`${styles.tab} ${activeTab === 'member' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('member')}
              >
                Member Login
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'committee' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('committee')}
              >
                Committee Login
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Mobile Number or Email
                </label>
                <div className={styles.inputWrapper}>
                  <User size={18} className={styles.inputIcon} />
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="Enter details"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  {activeTab === 'member' ? 'OTP or Password' : 'Password'}
                  <a href="#" className={styles.forgotLink}>Forgot Password?</a>
                </label>
                <div className={styles.inputWrapper}>
                  <Lock size={18} className={styles.inputIcon} />
                  <input
                    type="password"
                    className={styles.inputField}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button type="submit" className={styles.submitBtn}>
                Access Account
              </button>
            </form>

            <p className={styles.joinText}>
              Not a member? <a href="/register" className={styles.joinLink}>Join us</a>
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
        <img src="/images/history.png" alt="Kutchi Jain Oswal Samaj Heritage" className={styles.heritageImage} />
        <div className={styles.imageOverlay}>
          <h2>A Century of Unity</h2>
          <p>Over 100 years of empowering our community globally.</p>
        </div>
      </div>
    </div>
  );
}
