import React from 'react';
import styles from './Badge.module.css';

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
