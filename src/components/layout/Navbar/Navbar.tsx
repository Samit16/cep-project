'use client';

import React, { useState, useEffect } from 'react';
import { Search, User, Home, LogOut } from 'lucide-react';
import styles from './Navbar.module.css';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check on mount
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    router.push('/');
  };

  // Generate user initials for the avatar
  const getUserInitial = () => {
    if (user?.sub) {
      return user.sub.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const links = [
    { label: 'Directory', href: '/directory' },
    { label: 'About', href: '/about' },
    { label: 'Archives', href: '/#archives' },
  ];

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`} role="navigation" aria-label="Main navigation">
      <Link href="/" className={styles.logo} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
          <Link href="/profile" className={styles.profileLink}>
            <span className={styles.userAvatar}>{getUserInitial()}</span>
            <span>My Profile</span>
          </Link>
        )}

        {user ? (
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={15} />
            Logout
          </button>
        ) : (
          <Link href="/login" className={styles.joinBtn}>
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
