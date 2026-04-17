'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar/Navbar';
import Footer from '@/components/layout/Footer/Footer';
import styles from './AboutPage.module.css';
import { Heart, BookOpen, Users, Landmark, Target, Eye, Globe, Award } from 'lucide-react';
import {
  useGsapHeroEntrance,
  useGsapSectionFlow,
  useGsapStagger,
  useGsapCounter,
} from '@/hooks/useGsapAnimations';

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
  // Progressive animation hooks
  const heroRef = useGsapHeroEntrance<HTMLElement>('.gsap-about-hero');
  const timelineRef = useGsapSectionFlow<HTMLElement>();
  const timelineCardsRef = useGsapStagger<HTMLDivElement>('.gsap-timeline-card', {
    stagger: 0.18,
    duration: 0.9,
    distance: 35,
  });
  const valuesRef = useGsapSectionFlow<HTMLElement>();
  const valuesGridRef = useGsapStagger<HTMLDivElement>('.gsap-value-card', {
    stagger: 0.15,
    duration: 0.85,
    distance: 30,
  });
  const missionRef = useGsapSectionFlow<HTMLElement>();
  const missionGridRef = useGsapStagger<HTMLDivElement>('.gsap-mission-card', {
    stagger: 0.2,
    duration: 0.9,
  });
  const impactRef = useGsapSectionFlow<HTMLElement>();
  const impactGridRef = useGsapStagger<HTMLDivElement>('.gsap-impact-item', {
    stagger: 0.12,
    duration: 0.8,
    distance: 25,
  });
  const ctaRef = useGsapSectionFlow<HTMLElement>();
  const ctaContentRef = useGsapStagger<HTMLDivElement>('.gsap-cta-item', {
    stagger: 0.18,
    duration: 1,
  });

  // Counter refs for impact stats
  const chaptersCountRef = useGsapCounter<HTMLDivElement>(120);
  const membersCountRef = useGsapCounter<HTMLDivElement>(500);
  const scholarshipsCountRef = useGsapCounter<HTMLDivElement>(2000);
  const yearsCountRef = useGsapCounter<HTMLDivElement>(100);

  return (
    <>
      <Navbar variant="public" activeLink="about" />
      <main className={styles.aboutContainer}>
        {/* Hero */}
        <section ref={heroRef} className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={`${styles.heroBadge} gsap-about-hero`}>Est. 1921</span>
            <h1 className={`${styles.title} gsap-about-hero`}>
              Our Shared <span className={styles.italic}>Roots</span>
            </h1>
            <p className={`${styles.subtitle} gsap-about-hero`}>
              For over a century, KVO Nagpur has been a home away from home — connecting thousands 
              of us across six continents through shared roots and values.
            </p>
          </div>
        </section>

        {/* Timeline */}
        <section ref={timelineRef} className={styles.timelineSection}>
          <div className={styles.timelineHeader}>
            <p className={styles.sectionLabel}>Our Journey</p>
            <h2 className={styles.sectionTitle}>The Century <span className={styles.italic}>Journey</span></h2>
            <p className={styles.sectionSubtitle}>Key moments that shaped who we are today.</p>
          </div>
          <div ref={timelineCardsRef} className={styles.timeline}>
            {milestones.map((m, i) => (
              <div key={m.year} className={`${styles.timelineItem} ${i % 2 === 0 ? styles.timelineLeft : styles.timelineRight} gsap-timeline-card`}>
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
        <section ref={valuesRef} className={styles.valuesSection}>
          <div className={styles.valuesHeader}>
            <p className={styles.sectionLabel}>Our Pillars</p>
            <h2 className={styles.sectionTitle}>Core Values</h2>
          </div>
          <div ref={valuesGridRef} className={styles.valuesGrid}>
            {values.map((v) => (
              <div key={v.title} className={`${styles.valueCard} gsap-value-card`}>
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
        <section ref={missionRef} className={styles.missionSection}>
          <div ref={missionGridRef} className={styles.missionGrid}>
            <div className={`${styles.missionCard} gsap-mission-card`}>
              <div className={styles.missionIcon}><Target size={28} /></div>
              <h3 className={styles.missionTitle}>Our Mission</h3>
              <p className={styles.missionText}>
                To keep our culture thriving while building a space where members can grow in their careers, 
                support each other, and find personal fulfillment. We celebrate who we are, making sure that 
                as we grow and look to the future, we always remember where we came from.
              </p>
            </div>
            <div className={`${styles.missionCard} gsap-mission-card`}>
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
        <section ref={impactRef} className={styles.impactSection}>
          <div ref={impactGridRef} className={styles.impactGrid}>
            <div className={`${styles.impactItem} gsap-impact-item`}>
              <Globe size={28} className={styles.impactIcon} />
              <div ref={chaptersCountRef} className={styles.impactValue}>0</div>
              <div className={styles.impactLabel}>Global Chapters</div>
            </div>
            <div className={`${styles.impactItem} gsap-impact-item`}>
              <Users size={28} className={styles.impactIcon} />
              <div className={styles.impactValue}><span ref={membersCountRef}>0</span>+</div>
              <div className={styles.impactLabel}>Active Members</div>
            </div>
            <div className={`${styles.impactItem} gsap-impact-item`}>
              <Award size={28} className={styles.impactIcon} />
              <div className={styles.impactValue}><span ref={scholarshipsCountRef}>0</span>+</div>
              <div className={styles.impactLabel}>Scholarships Awarded</div>
            </div>
            <div className={`${styles.impactItem} gsap-impact-item`}>
              <Landmark size={28} className={styles.impactIcon} />
              <div className={styles.impactValue}><span ref={yearsCountRef}>0</span>+</div>
              <div className={styles.impactLabel}>Years of Legacy</div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section ref={ctaRef} className={styles.ctaSection}>
          <div ref={ctaContentRef}>
            <h2 className={`${styles.ctaTitle} gsap-cta-item`}>Be Part of Our Story</h2>
            <p className={`${styles.ctaText} gsap-cta-item`}>
              Join KVO Nagpur today, meet new friends, and be part of a community that spans generations.
            </p>
            <div className={`${styles.ctaActions} gsap-cta-item`}>
              <Link href="/login" className={styles.ctaBtnPrimary}>Join the Community</Link>
              <Link href="/directory" className={styles.ctaBtnOutline}>Browse Directory</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
