import React from 'react';
import Navbar from '@/components/layout/Navbar/Navbar';
import Footer from '@/components/layout/Footer/Footer';
import styles from './AboutPage.module.css';
import { History, Target, Users, ShieldCheck } from 'lucide-react';

export default function AboutPage() {
  return (
    <>
      <Navbar variant="public" activeLink="about" />
      <main className={styles.aboutContainer}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>Our Sacred <span className={styles.italic}>Heritage</span></h1>
            <p className={styles.subtitle}>
              For over a century, the Kutchi Jain Oswal Samaj has stood as a beacon of unity, 
              tradition, and progress.
            </p>
          </div>
        </section>

        <section className={styles.contentSection}>
          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.iconWrapper}><Users size={24} /></div>
              <h3>Our Unity</h3>
              <p>We are a global community of over 50,000 members, connected by our roots in Kutch and our shared values of compassion and commerce.</p>
            </div>
            <div className={styles.card}>
              <div className={styles.iconWrapper}><ShieldCheck size={24} /></div>
              <h3>Our Values</h3>
              <p>Built on the principles of Jainism, we prioritize ethical living, non-violence (Ahimsa), and mutual support in all our endeavors.</p>
            </div>
          </div>
        </section>

        <section className={styles.historySection}>
          <div className={styles.historyText}>
            <h2>The Century <span className={styles.italic}>Journey</span></h2>
            <p>
              Founded in 1921, our Samaj was created to provide a support system for those migrating 
              from Kutch to industrial hubs. What began as a small group of visionary leaders has 
              grown into a worldwide network of professionals, entrepreneurs, and philanthropists.
            </p>
            <p>
              We act as the custodians of our culture, ensuring that while we embrace the future 
              of technology and global trade, we never lose sight of our spiritual and cultural foundation.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
