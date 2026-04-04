'use client';

import React from 'react';
import { Search, User } from 'lucide-react';
import styles from './Navbar.module.css';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

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
  const { user, role, logout } = useAuth();

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
  };

  const links = [
    { label: 'Directory', href: '/directory' },
    { label: 'About', href: '/about' },
    { label: 'Achievements', href: '/#achievements' },
  ];

  return (
    <nav className={styles.navbar} role="navigation" aria-label="Main navigation">
      <Link href="/" className={styles.logo}>
        KJO Samaj
      </Link>

      <div className={styles.navLinks}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`${styles.navLink} ${activeLink === link.label.toLowerCase() ? styles.navLinkActive : ''}`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className={styles.navActions}>
        {showSearch && (
          <div className={styles.searchBar}>
            <Search size={16} className={styles.searchIcon} />
            <input type="text" placeholder="Search members..." />
          </div>
        )}

        {role === 'admin' && (
          <Link href="/dashboard" className={styles.dashboardBtn}>
            Dashboard
          </Link>
        )}

        {user && (
          <Link href="/directory/me" className={styles.profileLink}>
            <User size={18} />
            <span>My Profile</span>
          </Link>
        )}

        {user ? (
          <button className={styles.joinBtn} onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <>
            <Link href="/login" className={styles.memberLoginBtn}>
              Login
            </Link>
            <Link href="/login?tab=committee" className={styles.joinBtn}>
              Join Us
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
