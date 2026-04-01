import React from 'react';
import styles from './Footer.module.css';

export default function Footer() {
  const links = [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Community Guidelines', href: '/guidelines' },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerTop}>
          <span className={styles.footerLogo}>KJO Samaj</span>
          <div className={styles.footerLinks}>
            {links.map((link) => (
              <a key={link.href} href={link.href} className={styles.footerLink}>
                {link.label}
              </a>
            ))}
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p className={styles.copyright}>
            © 2024 Kutchi Jain Oswal Samaj. Preserving Heritage, Building Future.
          </p>
        </div>
      </div>
    </footer>
  );
}
