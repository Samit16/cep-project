import React from 'react';
import { Search } from 'lucide-react';
import styles from './Navbar.module.css';

interface NavbarProps {
  variant?: 'public' | 'admin';
  activeLink?: string;
  showSearch?: boolean;
}

export default function Navbar({
  variant = 'public',
  activeLink = '',
  showSearch = false,
}: NavbarProps) {
  const links = [
    { label: 'Directory', href: '/directory' },
    { label: 'About', href: '/about' },
    { label: 'Achievements', href: '/#achievements' },
  ];

  return (
    <nav className={styles.navbar} role="navigation" aria-label="Main navigation">
      <a href="/" className={styles.logo}>
        KJO Samaj
      </a>

      <div className={styles.navLinks}>
        {variant === 'admin' && (
          <span style={{ color: 'var(--color-accent-gold)', fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: '0.9375rem', marginRight: 'var(--space-4)' }}>
            Committee<br />Overview
          </span>
        )}
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className={`${styles.navLink} ${activeLink === link.label.toLowerCase() ? styles.navLinkActive : ''}`}
          >
            {link.label}
          </a>
        ))}
      </div>

      <div className={styles.navActions}>
        {showSearch && (
          <div className={styles.searchBar}>
            <Search size={16} className={styles.searchIcon} />
            <input type="text" placeholder="Search members..." />
          </div>
        )}

        <a href="/login" className={styles.memberLoginBtn}>
          Member Login
        </a>
        <a href="/login?tab=committee" className={styles.joinBtn}>
          Join Us
        </a>
      </div>
    </nav>
  );
}
