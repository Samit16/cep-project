'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/Toast/ToastProvider';
import styles from './LandingPage.module.css';

export function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={`${styles.heroContent} ${styles.animateFadeUp}`}>
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
          the custodians of the Kutchi Jain Oswal legacy, empowering
          generations through unity.
        </p>
        <div className={`${styles.heroCta} ${styles.animateFadeUp} ${styles.delay3}`}>
          <a href="/login" className={styles.ctaBtnPrimary}>
            Become a Member
          </a>
          <a href="/directory" className={styles.ctaBtnOutlinedHero}>
            Explore Directory
          </a>
        </div>
      </div>
      <div className={styles.heroImage}>
        <img src="/images/hero.png" alt="Heritage architecture of the Kutchi Jain Oswal community" />
      </div>
    </section>
  );
}

export function HistoryMissionSection() {
  return (
    <section className={styles.historySection}>
      <div className={styles.historySectionInner} id="history">
        <div className={styles.historyImage}>
          <img src="/images/history.png" alt="Historical photograph of community founders" />
        </div>
        <div className={styles.historyContent}>
          <p className={styles.historyLabel}>The Heritage Realm</p>
          <h2 className={styles.historyTitle}>History &amp; Mission</h2>
          <p className={styles.historyText}>
            Founded on the bedrock of resilience and mutual prosperity, the Kutchi Jain
            Oswal Samaj has been a pillar of strength for over a century. Our ancestors
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
  return (
    <section id="achievements" className={styles.achievementsSection}>
      <div className={styles.achievementsSectionInner}>
        <h2 className={styles.achievementsTitle}>Celebrating Excellence</h2>
        <p className={styles.achievementsSubtitle}>
          Honouring those whose contributions and impact inspire the future of the Samaj.
        </p>
        <div className={styles.bentoGrid}>
          {/* Card 1 - Top Left */}
          <div className={styles.bentoCard}>
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
          <div className={styles.bentoBanner}>
            <div className={styles.bentoBannerBg}>
              <img src="/images/history.png" alt="" />
            </div>
            <div className={styles.bentoBannerContent}>
              <span className={styles.bentoCardLabel} style={{ color: 'rgba(255,255,255,0.7)' }}>Global Heritage</span>
              <h3 className={styles.bentoBannerTitle}>The Global Heritage Meet</h3>
              <p className={styles.bentoBannerText}>
                Connecting business leaders and cultural experts from
                across 6 continents to discuss our future.
              </p>
              <a href="/events" className={styles.registerBtn} style={{ display: 'inline-block', textDecoration: 'none' }}>
                View Event Figures
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function EventsSection() {
  const { toast } = useToast();
  const eventDate = new Date('2024-04-15');
  
  return (
    <section className={styles.eventsSection}>
      <div className={styles.eventsSectionInner}>
        <div className={styles.eventsHeader}>
          <div>
            <h2 className={styles.eventsTitle}>Upcoming Events</h2>
            <p className={styles.eventsSubtitle}>
              Join our community gatherings and celebrate your heritage together.
            </p>
          </div>
          <a href="/events" className={styles.eventsLink}>
            See All Events <ArrowRight size={14} />
          </a>
        </div>
        
        <div className={styles.eventCard}>
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
  return (
    <section className={styles.ctaBanner}>
      <h2 className={styles.ctaTitle}>Ready to Shape Our Tomorrow?</h2>
      <p className={styles.ctaSubtitle}>
        Join the KJO Samaj today. Gain access to a worldwide network and contribute
        to our community&apos;s lasting legacy.
      </p>
      <div className={styles.ctaActions}>
        <a href="/login" className={styles.ctaBtnOutlined} style={{ textDecoration: 'none' }}>
          Join the Community
        </a>
        <a href="/login" className={styles.ctaBtnOutlined} style={{ textDecoration: 'none' }}>
          Member Login
        </a>
      </div>
    </section>
  );
}
