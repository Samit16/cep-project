'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin } from 'lucide-react';
import styles from './Footer.module.css';
import { useGsapStagger, useGsapReveal } from '@/hooks/useGsapAnimations';

export default function Footer() {
  const footerRef = useGsapReveal<HTMLElement>();
  const columnsRef = useGsapStagger<HTMLDivElement>('.gsap-footer-col', {
    stagger: 0.15,
    duration: 0.8,
    distance: 30,
  });

  const quickLinks = [
    { label: 'Home', href: '/home' },
    { label: 'About', href: '/about' },
    { label: 'Directory', href: '/directory' },
    { label: 'Contact Us', href: '/contact' },
  ];

  const legalLinks = [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Community Guidelines', href: '/guidelines' },
  ];

  return (
    <footer ref={footerRef} className={styles.footer}>
      <div ref={columnsRef} className={styles.footerInner}>
        {/* Brand Column */}
        <div className={`${styles.footerCol} ${styles.brandCol} gsap-footer-col`}>
          <Link href="/home" className={styles.logoLink}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo.png"
              alt="KVO Nagpur"
              className={styles.footerLogo}
            />
          </Link>
          <p className={styles.tagline}>
            Preserving Heritage, Building Future.
            <br />
            Connecting our community across generations since 1921.
          </p>
          <div className={styles.socialRow}>
            <a href="mailto:shrinagpurkvosamaj@yahoo.com" className={styles.socialIcon} aria-label="Email">
              <Mail size={18} />
            </a>
            <a href="tel:07122766217" className={styles.socialIcon} aria-label="Phone">
              <Phone size={18} />
            </a>
          </div>
        </div>

        {/* Quick Links Column */}
        <div className={`${styles.footerCol} gsap-footer-col`}>
          <h4 className={styles.colTitle}>Quick Links</h4>
          <ul className={styles.linkList}>
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={styles.footerLink}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal Column */}
        <div className={`${styles.footerCol} gsap-footer-col`}>
          <h4 className={styles.colTitle}>Legal</h4>
          <ul className={styles.linkList}>
            {legalLinks.map((link) => (
              <li key={link.href}>
                <span className={styles.footerLinkDisabled}>
                  {link.label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Column */}
        <div className={`${styles.footerCol} gsap-footer-col`}>
          <h4 className={styles.colTitle}>Contact Us</h4>
          <ul className={styles.contactList}>
            <li className={styles.contactItem}>
              <Phone size={16} className={styles.contactIcon} />
              <a href="tel:07122766217" className={styles.contactLink}>
                0712-2766217
              </a>
            </li>
            <li className={styles.contactItem}>
              <Mail size={16} className={styles.contactIcon} />
              <a href="mailto:shrinagpurkvosamaj@yahoo.com" className={styles.contactLink}>
                shrinagpurkvosamaj@yahoo.com
              </a>
            </li>
            <li className={styles.contactItem}>
              <MapPin size={16} className={styles.contactIcon} />
              <address className={styles.address}>
                57/58, Anath Vidyarthi Gruh Lay-out,
                <br />
                Satnami Nagar, Lakadganj,
                <br />
                Nagpur &ndash; 440008
              </address>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={styles.footerBottom}>
        <p className={styles.copyright}>
          &copy; {new Date().getFullYear()} Shri Nagpur Kutchi Visa Oswal Samaj. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
