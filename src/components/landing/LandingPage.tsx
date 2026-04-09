'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast/ToastProvider';
import { useParallax, useScrollReveal } from '@/hooks/useParallax';
import styles from './LandingPage.module.css';

export function HeroSection() {
  const heroImageRef = useParallax<HTMLDivElement>({ speed: 0.15 });
  const heroContentRef = useParallax<HTMLDivElement>({ speed: -0.08 });

  return (
    <section className={styles.hero}>
      <div ref={heroContentRef} className={`${styles.heroContent} ${styles.parallaxContent} ${styles.animateFadeUp}`}>
        <span className={styles.heroLabel}>Established Since 1921</span>
        <h1 className={`${styles.heroTitle} ${styles.animateFadeUp} ${styles.delay1}`}>
          Connecting Our{' '}
          <span className={styles.heroTitleHighlight}>
            Heritage
          </span>
          ,{' '}
          <span className={styles.heroTitleItalic}>Building<br />Our Future</span>
        </h1>
        <p className={`${styles.heroSubtitle} ${styles.animateFadeUp} ${styles.delay2}`}>
          A vibrant tapestry of culture, commerce, and community. We stand as
          the custodians of the KVO Nagpur legacy, empowering
          generations through unity.
        </p>
        <div className={`${styles.heroCta} ${styles.animateFadeUp} ${styles.delay3}`}>
          <Link href="/login" className={styles.ctaBtnPrimary}>
            Become a Member
          </Link>
        </div>
      </div>
      <div ref={heroImageRef} className={`${styles.heroImage} ${styles.parallaxImage}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/hero.png" alt="Heritage architecture of the KVO Nagpur community" />
      </div>
    </section>
  );
}

export function HistoryMissionSection() {
  const imageRef = useParallax<HTMLDivElement>({ speed: 0.2 });
  const contentRef = useScrollReveal<HTMLDivElement>();

  return (
    <section className={styles.historySection}>
      <div className={styles.historySectionInner} id="history">
        <div ref={imageRef} className={`${styles.historyImage} ${styles.parallaxImageContainer}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/history.png" alt="Historical photograph of community founders" className={styles.parallaxInnerImage} />
        </div>
        <div ref={contentRef} className={`${styles.historyContent} ${styles.scrollReveal}`}>
          <p className={styles.historyLabel}>The Heritage Realm</p>
          <h2 className={styles.historyTitle}>History &amp; Mission</h2>
          <p className={styles.historyText}>
            Founded on the bedrock of resilience and mutual prosperity, the KVO
            Nagpur has been a pillar of strength for over a century. Our ancestors
            transitioned from the arid plains of Kutch to the bustling centers of global
            commerce.
          </p>
          <p className={styles.historyText}>
            Today, our mission remains steadfast: to preserve the rich cultural tapestry of
            our heritage while providing a modern ecosystem for professional growth,
            social welfare, and spiritual enlightenment.
          </p>
          <div className={styles.historyStats}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>50k<span className={styles.statSuffix}>+</span></div>
              <div className={styles.statLabel}>Active Members</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>120</div>
              <div className={styles.statLabel}>Global Chapters</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>100<span className={styles.statSuffix}>yr</span></div>
              <div className={styles.statLabel}>Legacy</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AchievementsSection() {
  const titleRef = useScrollReveal<HTMLDivElement>();
  const bannerRef = useParallax<HTMLDivElement>({ speed: 0.12 });

  return (
    <section id="archives" className={styles.achievementsSection}>
      <div ref={titleRef} className={`${styles.achievementsSectionInner} ${styles.scrollReveal}`}>
        <h2 className={styles.achievementsTitle}>Archives</h2>
        <p className={styles.achievementsSubtitle}>
          Honouring those whose contributions and impact inspire the future of the Samaj.
        </p>
        <div className={styles.bentoGrid}>
          {/* Card 1 - Top Left */}
          <div className={styles.bentoCard}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.bentoCardImage} src="/images/hero.png" alt="Excellence in Education Grant" />
            <span className={styles.bentoCardLabel}>Education</span>
            <h3 className={styles.bentoCardTitle}>Excellence in Education Grant</h3>
            <p className={styles.bentoCardText}>
              Recognising 41 scholars and outstanding Samaj members who have made extraordinary
              contributions to education.
            </p>
            <a href="#history" className={styles.bentoCardLink}>
              Learn More <ArrowRight size={14} />
            </a>
          </div>
          {/* Card 2 - Bottom Left */}
          <div className={styles.bentoCard}>
            <span className={styles.bentoCardLabel}>Entrepreneurial Spirit</span>
            <h3 className={styles.bentoCardTitle}>Entrepreneurial Spirit</h3>
            <p className={styles.bentoCardText}>
              A showcase of those in our community who are building businesses, creating employment,
              and strengthening our legacy.
            </p>
            <a href="#" className={styles.bentoCardLink}>
              View Stories <ArrowRight size={14} />
            </a>
          </div>
          {/* Banner - Right column spanning both rows */}
          <div ref={bannerRef} className={`${styles.bentoBanner} ${styles.parallaxBanner}`}>
            <div className={styles.bentoBannerBg}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/history.png" alt="" />
            </div>
            <div className={styles.bentoBannerContent}>
              <span className={styles.bentoCardLabel} style={{ color: 'rgba(255,255,255,0.7)' }}>Global Heritage</span>
              <h3 className={styles.bentoBannerTitle}>The Global Heritage Meet</h3>
              <p className={styles.bentoBannerText}>
                Connecting business leaders and cultural experts from
                across 6 continents to discuss our future.
              </p>
              <Link href="/events" className={styles.registerBtn} style={{ display: 'inline-block', textDecoration: 'none' }}>
                View Event Figures
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function EventsSection() {
  const { toast } = useToast();
  const sectionRef = useScrollReveal<HTMLElement>();
  
  return (
    <section ref={sectionRef} className={`${styles.eventsSection} ${styles.scrollReveal}`}>
      <div className={styles.eventsSectionInner}>
        <div className={styles.eventsHeader}>
          <div>
            <h2 className={styles.eventsTitle}>Upcoming Events</h2>
            <p className={styles.eventsSubtitle}>
              Join our community gatherings and celebrate your heritage together.
            </p>
          </div>
          <Link href="/events" className={styles.eventsLink}>
            See All Events <ArrowRight size={14} />
          </Link>
        </div>
        
        <div className={styles.eventCard}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/events/event1.png"
            alt="Heritage Gala & Cultural Night"
            className={styles.eventCardImage}
          />
          <div className={styles.eventCardContent}>
            <h3 className={styles.eventCardTitle}>Heritage Gala &amp; Cultural Night</h3>
            <p className={styles.eventCardLocation}>Grand Ballroom, Samaj Center · Dadar</p>
          </div>
          <div className={styles.eventCardActions}>
            <div className={styles.eventDate}>
              <div className={styles.eventDateDay}>15</div>
              <div className={styles.eventDateMonth}>Apr</div>
            </div>
            <button className={styles.registerBtn} onClick={() => toast('Registration successful! You will receive a confirmation SMS.', 'success')}>
              Register
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CTABanner() {
  const ctaRef = useScrollReveal<HTMLElement>();

  return (
    <section ref={ctaRef} className={`${styles.ctaBanner} ${styles.scrollReveal}`}>
      <h2 className={styles.ctaTitle}>Ready to Shape Our Tomorrow?</h2>
      <p className={styles.ctaSubtitle}>
        Join KVO Nagpur today. Gain access to a worldwide network and contribute
        to our community&apos;s lasting legacy.
      </p>
      <div className={styles.ctaActions}>
        <Link href="/login" className={styles.ctaBtnOutlined} style={{ textDecoration: 'none' }}>
          Join the Community
        </Link>
        <Link href="/login" className={styles.ctaBtnOutlined} style={{ textDecoration: 'none' }}>
          Member Login
        </Link>
      </div>
    </section>
  );
}
