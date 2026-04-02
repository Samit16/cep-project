'use client';

import React, { useState, useEffect } from 'react';
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
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const authSession = localStorage.getItem('kjo_simulated_auth');
      setIsAdmin(authSession === 'committee');
    };

    checkAuth();

    // Listen for cross-tab changes
    window.addEventListener('storage', checkAuth);

    // Listen for same-tab changes (custom event)
    window.addEventListener('kjo_auth_change', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('kjo_auth_change', checkAuth);
    };
  }, []);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.removeItem('kjo_simulated_auth');
    window.dispatchEvent(new Event('kjo_auth_change'));
    window.location.href = '/login';
  };

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

        {isAdmin && variant !== 'admin' && (
          <a href="/dashboard" className={styles.dashboardBtn}>
            Dashboard
          </a>
        )}

        {isAdmin ? (
          <a href="/login" className={styles.joinBtn} onClick={handleLogout}>
            Logout
          </a>
        ) : (
          <>
            <a href="/login" className={styles.memberLoginBtn}>
              Login
            </a>
            <a href="/login?tab=committee" className={styles.joinBtn}>
              Join Us
            </a>
          </>
        )}
      </div>
    </nav>
  );
}
