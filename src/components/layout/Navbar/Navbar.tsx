'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User, ChevronDown, Menu, X } from 'lucide-react';
import styles from './Navbar.module.css';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LinkGooglePrompt from '@/components/auth/LinkGooglePrompt';
import { useGsapNavbar, useGsapHover } from '@/hooks/useGsapAnimations';

interface NavbarProps {
  variant?: 'public' | 'admin';
  activeLink?: string;
}

export default function Navbar({
  activeLink = '',
}: NavbarProps) {
  const navRef = useGsapNavbar<HTMLElement>();
  const { user, role, logout } = useAuth();
  const pathname = usePathname();
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
    <nav ref={navRef} className={styles.navbar} role="navigation" aria-label="Main navigation">
      <Link href="/home" className={styles.logo}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo.png" alt="KVO Nagpur" className={styles.logoImage} />
      </Link>

      {/* Desktop Navigation */}
      <div className={styles.desktopNav}>
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
            <>
              <Link href="/about" className={styles.navLink}>
                About
              </Link>
              <Link href="/contact" className={styles.navLink}>
                Contact
              </Link>
            </>
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
                  <Link href="/login?tab=member" className={styles.loginDropdownItem} onClick={() => setLoginDropdownOpen(false)}>
                    Member Login
                  </Link>
                  <Link href="/login?tab=committee" className={styles.loginDropdownItem} onClick={() => setLoginDropdownOpen(false)}>
                    Committee Login
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Toggle Button */}
      <button 
        className={styles.mobileMenuBtn} 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle Navigation"
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Navigation Drawer */}
      <div className={`${styles.mobileNavDrawer} ${mobileMenuOpen ? styles.mobileNavOpen : ''}`}>
        <div className={styles.mobileNavLinks}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.mobileNavLink} ${activeLink === link.label.toLowerCase() ? styles.mobileNavLinkActive : ''}`}
            >
              {link.label}
            </Link>
          ))}
          {pathname !== '/login' && (
            <>
              <Link href="/about" className={styles.mobileNavLink}>About</Link>
              <Link href="/contact" className={styles.mobileNavLink}>Contact</Link>
            </>
          )}
        </div>
        
        <div className={styles.mobileNavActions}>
          {(role === 'admin' || role === 'committee') && (
            <Link href="/dashboard" className={styles.mobileDashboardBtn}>
              Dashboard
            </Link>
          )}
          {user && (
            <Link href="/directory/me" className={styles.mobileProfileLink}>
              <User size={18} /> My Profile
            </Link>
          )}
          {user ? (
            <button className={styles.mobileJoinBtn} onClick={handleLogout}>Logout</button>
          ) : (
            <div className={styles.mobileLoginStack}>
              <Link href="/login?tab=member" className={styles.mobileJoinBtn}>Member Login</Link>
              <Link href="/login?tab=committee" className={styles.mobileCommitteeBtn}>Committee Login</Link>
            </div>
          )}
        </div>
      </div>
      <LinkGooglePrompt />
    </nav>
  );
}
