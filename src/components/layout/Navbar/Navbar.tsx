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
    { label: 'Dashboard', href: '/dashboard', isAdmin: true },
    { label: 'About', href: '/about' },
    { label: 'Achievements', href: '/#achievements' },
  ];

  return (
    <nav className={styles.navbar} role="navigation" aria-label="Main navigation">
      <a href="/" className={styles.logo}>
        KJO Samaj
      </a>

      <div className={styles.navLinks}>
        {links.map((link) => {
          if (link.isAdmin && variant !== 'admin') return null;
          return (
            <a
              key={link.href}
              href={link.href}
              className={`${styles.navLink} ${activeLink === link.label.toLowerCase() ? styles.navLinkActive : ''}`}
            >
              {link.label}
            </a>
          );
        })}
      </div>

      <div className={styles.navActions}>
        {showSearch && (
          <div className={styles.searchBar}>
            <Search size={16} className={styles.searchIcon} />
            <input type="text" placeholder="Search members..." />
          </div>
        )}

        {variant !== 'admin' && (
          <a href="/dashboard" className={styles.dashboardBtn}>
            Dashboard
          </a>
        )}

        <a href="/login" className={styles.memberLoginBtn}>
          {variant === 'admin' ? 'Member Portal' : 'Login'}
        </a>
        <a href="/login?tab=committee" className={styles.joinBtn}>
          {variant === 'admin' ? 'New Request' : 'Join Us'}
        </a>
      </div>
    </nav>
  );
}
