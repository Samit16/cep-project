'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Home, User, ChevronDown } from 'lucide-react';
import styles from './Navbar.module.css';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavbarProps {
  variant?: 'public' | 'admin';
  activeLink?: string;
}

export default function Navbar({
  activeLink = '',
}: NavbarProps) {
  const { user, role, logout } = useAuth();
  const pathname = usePathname();
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setLoginDropdownOpen(false);
      }
    };
    if (loginDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [loginDropdownOpen]);

  const handleLogout = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    
    if (!window.confirm('Are you sure you want to log out?')) return;

    await logout();
    window.location.replace('/home');
  };

  const links = [
    // Directory and Archives are only visible when logged in
    ...(user ? [
      { label: 'Archives', href: '/archives', public: false },
      { label: 'Directory', href: '/directory', public: false },
    ] : []),
  ];

  return (
    <nav className={styles.navbar} role="navigation" aria-label="Main navigation">
      <Link href="/home" className={styles.logo} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Home size={24} />
        KVO Nagpur
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

        {(role === 'admin' || role === 'committee') && (
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

        {pathname !== '/login' && (
          <Link
            href="/about"
            className={styles.navLink}
          >
            About
          </Link>
        )}

        {user ? (
          <button className={styles.joinBtn} onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <div ref={dropdownRef} className={styles.loginDropdownWrapper}>
            <button
              className={styles.joinBtn}
              onClick={() => setLoginDropdownOpen(prev => !prev)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              Login <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: loginDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>
            {loginDropdownOpen && (
              <div className={styles.loginDropdownMenu}>
                <Link
                  href="/login?tab=member"
                  className={styles.loginDropdownItem}
                  onClick={() => setLoginDropdownOpen(false)}
                >
                  Member Login
                </Link>
                <Link
                  href="/login?tab=committee"
                  className={styles.loginDropdownItem}
                  onClick={() => setLoginDropdownOpen(false)}
                >
                  Committee Login
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
