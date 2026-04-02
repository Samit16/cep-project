'use client';

import React from 'react';
import Navbar from '@/components/layout/Navbar/Navbar';
import Footer from '@/components/layout/Footer/Footer';
import styles from './AboutPage.module.css';
import { Heart, BookOpen, Users, Landmark, Target, Eye, Globe, Award } from 'lucide-react';

const milestones = [
  { year: '1921', title: 'Foundation', description: 'A group of visionary community leaders established the Samaj in Mumbai to support migrants from the Kutch region.' },
  { year: '1952', title: 'First Cultural Center', description: 'Inaugurated the community\'s first dedicated cultural center in Dadar, becoming a hub for heritage preservation.' },
  { year: '1985', title: 'International Expansion', description: 'Opened chapters in East Africa, the UK, and the Gulf states, connecting diaspora members worldwide.' },
  { year: '2003', title: 'Education Fund Launch', description: 'Launched a scholarship programme that has since supported over 2,000 students in higher education.' },
  { year: '2024', title: 'Digital Transformation', description: 'Unveiled this community platform to digitise the member directory and modernise governance for the next century.' },
];

const values = [
  { icon: Heart, title: 'Ahimsa', subtitle: 'Non-Violence', description: 'Rooted in the core Jain principle, we champion compassion and peaceful coexistence in every endeavour.' },
  { icon: Users, title: 'Seva', subtitle: 'Service', description: 'Selfless service to the community drives our welfare programmes, health camps, and disaster relief efforts.' },
  { icon: BookOpen, title: 'Vidya', subtitle: 'Education', description: 'We believe education is the greatest equaliser, funding scholarships and mentoring young professionals.' },
  { icon: Landmark, title: 'Vanijya', subtitle: 'Enterprise', description: 'Building on our mercantile heritage, we foster ethical entrepreneurship and professional networking.' },
];

export default function AboutPage() {
  return (
    <>
      <Navbar variant="public" activeLink="about" />
      <main className={styles.aboutContainer}>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>Est. 1921</span>
            <h1 className={styles.title}>
              Our Sacred <span className={styles.italic}>Heritage</span>
            </h1>
            <p className={styles.subtitle}>
              For over a century, the Kutchi Jain Oswal Samaj has stood as a beacon of unity,
              tradition, and progress — connecting thousands across six continents.
            </p>
          </div>
        </section>

        {/* Timeline */}
        <section className={styles.timelineSection}>
          <div className={styles.timelineHeader}>
            <p className={styles.sectionLabel}>Our Journey</p>
            <h2 className={styles.sectionTitle}>The Century <span className={styles.italic}>Journey</span></h2>
            <p className={styles.sectionSubtitle}>Key moments that shaped who we are today.</p>
          </div>
          <div className={styles.timeline}>
            {milestones.map((m, i) => (
              <div key={m.year} className={`${styles.timelineItem} ${i % 2 === 0 ? styles.timelineLeft : styles.timelineRight}`}>
                <div className={styles.timelineDot} />
                <div className={styles.timelineCard}>
                  <span className={styles.timelineYear}>{m.year}</span>
                  <h3 className={styles.timelineCardTitle}>{m.title}</h3>
                  <p className={styles.timelineCardText}>{m.description}</p>
                </div>
              </div>
            ))}
            <div className={styles.timelineLine} />
          </div>
        </section>

        {/* Values */}
        <section className={styles.valuesSection}>
          <div className={styles.valuesHeader}>
            <p className={styles.sectionLabel}>Our Pillars</p>
            <h2 className={styles.sectionTitle}>Core Values</h2>
          </div>
          <div className={styles.valuesGrid}>
            {values.map((v) => (
              <div key={v.title} className={styles.valueCard}>
                <div className={styles.valueIcon}>
                  <v.icon size={24} />
                </div>
                <h3 className={styles.valueTitle}>{v.title}</h3>
                <p className={styles.valueSubtitle}>{v.subtitle}</p>
                <p className={styles.valueText}>{v.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Mission & Vision */}
        <section className={styles.missionSection}>
          <div className={styles.missionGrid}>
            <div className={styles.missionCard}>
              <div className={styles.missionIcon}><Target size={28} /></div>
              <h3 className={styles.missionTitle}>Our Mission</h3>
              <p className={styles.missionText}>
                To preserve the rich cultural tapestry of our heritage while providing a modern
                ecosystem for professional growth, social welfare, and spiritual enlightenment.
                We act as custodians of our traditions, ensuring that while we embrace the future,
                we never lose sight of our foundation.
              </p>
            </div>
            <div className={styles.missionCard}>
              <div className={styles.missionIcon}><Eye size={28} /></div>
              <h3 className={styles.missionTitle}>Our Vision</h3>
              <p className={styles.missionText}>
                To build the most connected, empowered, and culturally vibrant community
                network in the world — one that serves as a model for how heritage communities
                can thrive in the modern era without sacrificing their identity.
              </p>
            </div>
          </div>
        </section>

        {/* Impact Stats */}
        <section className={styles.impactSection}>
          <div className={styles.impactGrid}>
            <div className={styles.impactItem}>
              <Globe size={28} className={styles.impactIcon} />
              <div className={styles.impactValue}>120</div>
              <div className={styles.impactLabel}>Global Chapters</div>
            </div>
            <div className={styles.impactItem}>
              <Users size={28} className={styles.impactIcon} />
              <div className={styles.impactValue}>50,000+</div>
              <div className={styles.impactLabel}>Active Members</div>
            </div>
            <div className={styles.impactItem}>
              <Award size={28} className={styles.impactIcon} />
              <div className={styles.impactValue}>2,000+</div>
              <div className={styles.impactLabel}>Scholarships Awarded</div>
            </div>
            <div className={styles.impactItem}>
              <Landmark size={28} className={styles.impactIcon} />
              <div className={styles.impactValue}>100+</div>
              <div className={styles.impactLabel}>Years of Legacy</div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className={styles.ctaSection}>
          <h2 className={styles.ctaTitle}>Be Part of Our Story</h2>
          <p className={styles.ctaText}>
            Join the Kutchi Jain Oswal Samaj today and contribute to a legacy that spans generations.
          </p>
          <div className={styles.ctaActions}>
            <a href="/login" className={styles.ctaBtnPrimary}>Join the Community</a>
            <a href="/directory" className={styles.ctaBtnOutline}>Browse Directory</a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
