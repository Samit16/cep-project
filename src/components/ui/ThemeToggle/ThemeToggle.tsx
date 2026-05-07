'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useTheme } from '@/lib/theme-context';
import styles from './ThemeToggle.module.css';

/**
 * Premium animated theme toggle inspired by Dribbble sun/moon morph.
 *
 * States:
 *  - Dark  → Crescent moon on left side, dark track
 *  - Light → Glowing sun on right side, light track with yellow glow
 *
 * The circle morphs between moon (with a "bite" overlay) and sun (radiant glow).
 */
export default function ThemeToggle() {
  const { theme, toggleTheme, isHydrated } = useTheme();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const isDark = theme === 'dark';

  // Prevent rendering until hydrated to avoid mismatch
  if (!isHydrated) {
    return <div className={styles.placeholder} aria-hidden="true" />;
  }

  return (
    <button
      ref={toggleRef}
      className={`${styles.toggle} ${isDark ? styles.dark : styles.light}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      type="button"
    >
      {/* Track */}
      <span className={styles.track}>
        {/* Glow ring around track */}
        <span className={styles.trackGlow} />

        {/* The celestial orb */}
        <span className={styles.orb}>
          {/* Moon bite (crescent effect) */}
          <span className={styles.moonBite} />

          {/* Sun rays */}
          <span className={styles.sunRays}>
            {[...Array(8)].map((_, i) => (
              <span
                key={i}
                className={styles.ray}
                style={{ '--ray-index': i } as React.CSSProperties}
              />
            ))}
          </span>
        </span>
      </span>
    </button>
  );
}
