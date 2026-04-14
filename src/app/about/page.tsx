'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar/Navbar';
import Footer from '@/components/layout/Footer/Footer';
import styles from './AboutPage.module.css';
import { Heart, BookOpen, Users, Landmark, Target, Eye, Globe, Award } from 'lucide-react';

const milestones = [
  { year: '1921', title: 'Foundation', description: 'A group of forward-looking community members started the Samaj in Mumbai to support fellow migrants arriving from the Kutch region.' },
  { year: '1952', title: 'First Cultural Center', description: 'Opened our first dedicated cultural center in Dadar, giving everyone a physical place to connect and keep our traditions alive.' },
  { year: '1985', title: 'International Expansion', description: 'Opened chapters in East Africa, the UK, and the Gulf states, connecting diaspora members worldwide.' },
  { year: '2003', title: 'Education Fund Launch', description: 'Started a scholarship fund that has since helped over 2,000 students pursue their dreams in higher education.' },
  { year: '2024', title: 'Digital Transformation', description: 'Launched this online platform to bring our community directory to your fingertips and step confidently into the future.' },
];

const values = [
  { icon: Heart, title: 'Ahimsa', subtitle: 'Non-Violence', description: 'Rooted in our core principles, we believe in acting with compassion and kindness in everything we do.' },
  { icon: Users, title: 'Seva', subtitle: 'Service', description: 'Giving back to our community drives our support programs, health initiatives, and community events.' },
  { icon: BookOpen, title: 'Vidya', subtitle: 'Education', description: 'We believe education changes lives, and we proudly fund scholarships to help our young people succeed.' },
  { icon: Landmark, title: 'Vanijya', subtitle: 'Enterprise', description: 'Honoring our business roots, we encourage ethical entrepreneurship and love seeing our members thrive together.' },
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
              Our Shared <span className={styles.italic}>Roots</span>
            </h1>
            <p className={styles.subtitle}>
              For over a century, KVO Nagpur has been a home away from home — connecting thousands 
              of us across six continents through shared roots and values.
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
                To keep our culture thriving while building a space where members can grow in their careers, 
                support each other, and find personal fulfillment. We celebrate who we are, making sure that 
                as we grow and look to the future, we always remember where we came from.
              </p>
            </div>
            <div className={styles.missionCard}>
              <div className={styles.missionIcon}><Eye size={28} /></div>
              <h3 className={styles.missionTitle}>Our Vision</h3>
              <p className={styles.missionText}>
                To build the most welcoming, supportive, and vibrant community network in the world 
                — showing how we can thrive in the modern world while staying true to our roots and 
                looking out for one another.
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
            Join KVO Nagpur today, meet new friends, and be part of a community that spans generations.
          </p>
          <div className={styles.ctaActions}>
            <Link href="/login" className={styles.ctaBtnPrimary}>Join the Community</Link>
            <Link href="/directory" className={styles.ctaBtnOutline}>Browse Directory</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
