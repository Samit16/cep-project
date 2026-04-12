'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Shield, Users, Lock } from 'lucide-react';
import styles from './WelcomePage.module.css';

export default function WelcomePage() {
  useEffect(() => {
    // Clean history / disable back & forward navigation by trapping state
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className={styles.welcome}>
      <div className={styles.content}>
        <div className={styles.badge}>
          <Shield size={12} />
          Official Community Portal
        </div>

        <h1 className={styles.title}>
          Welcome to <span>KVO Nagpur</span>
        </h1>
        <p className={styles.subtitle}>
          A century of preserving heritage, building futures, and connecting our
          community across the globe. Please select how you&apos;d like to sign in.
        </p>

        <div className={styles.cards}>
          {/* Member Login Card */}
          <Link href="/login?tab=member" className={styles.card}>
            <div className={`${styles.cardIcon} ${styles.memberIcon}`}>
              <Users size={26} color="#6aafe6" />
            </div>
            <div className={styles.cardTitle}>Member Login</div>
            <div className={styles.cardDesc}>
              Sign in with your registered Google account as a community member.
            </div>
            <div className={styles.cardArrow}>›</div>
          </Link>

          {/* Committee Login Card */}
          <Link href="/login?tab=committee" className={styles.card}>
            <div className={`${styles.cardIcon} ${styles.committeeIcon}`}>
              <Shield size={26} color="#e87070" />
            </div>
            <div className={styles.cardTitle}>Committee Login</div>
            <div className={styles.cardDesc}>
              Sign in with your committee credentials to access the admin portal.
            </div>
            <div className={styles.cardArrow}>›</div>
          </Link>
        </div>

        <div className={styles.meta}>
          <span className={styles.metaItem}><Lock size={12} /> Secure Access</span>
          <span className={styles.metaItem}><Shield size={12} /> Privacy First</span>
          <span className={styles.metaItem}><Users size={12} /> Members Only</span>
        </div>
      </div>
    </div>
  );
}
