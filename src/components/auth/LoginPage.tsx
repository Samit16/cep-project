'use client';

import React, { useState } from 'react';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'member' | 'committee'>('member');

  return (
    <div className={styles.loginPage}>
      {/* Concentric circles decoration */}
      <div className={styles.circlesDecor}>
        <div className={`${styles.circle} ${styles.circle1}`} />
        <div className={`${styles.circle} ${styles.circle2}`} />
        <div className={`${styles.circle} ${styles.circle3}`} />
        <div className={`${styles.circle} ${styles.circle4}`} />
        <div className={`${styles.circle} ${styles.circle5}`} />
        <div className={`${styles.circle} ${styles.circle6}`} />
      </div>

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
        <form onSubmit={(e) => e.preventDefault()}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Mobile Number or Email
            </label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>👤</span>
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
              <span className={styles.inputIcon}>🔒</span>
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
          <span className={styles.trustIcon}>🛡️</span>
          Secure Access
        </div>
        <div className={styles.trustBadge}>
          <span className={styles.trustIcon}>🔒</span>
          Privacy First
        </div>
        <div className={styles.trustBadge}>
          <span className={styles.trustIcon}>🏛️</span>
          Official Portal
        </div>
      </div>
    </div>
  );
}
