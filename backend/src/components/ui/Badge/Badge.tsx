import React from 'react';
import styles from './Badge.module.css';

interface BadgeProps {
  variant: 'verified' | 'pending' | 'inactive' | 'committee' | 'profession';
  size?: 'sm' | 'md';
  showDot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({
  variant,
  size = 'md',
  showDot = false,
  children,
  className = '',
}: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${styles[size]} ${className}`}>
      {showDot && <span className={styles.dot} />}
      {children}
    </span>
  );
}

interface OverlayBadgeProps {
  type: 'verified' | 'committee';
  children: React.ReactNode;
}

export function OverlayBadge({ type, children }: OverlayBadgeProps) {
  const overlayClass = type === 'verified' ? styles.overlayVerified : styles.overlayCommittee;
  return (
    <span className={`${styles.badge} ${styles.overlay} ${overlayClass}`}>
      {children}
    </span>
  );
}
