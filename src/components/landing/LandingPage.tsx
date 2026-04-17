'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast/ToastProvider';
import {
  useGsapHeroEntrance,
  useGsapReveal,
  useGsapStagger,
  useGsapParallax,
  useGsapSectionFlow,
  useGsapCounter,
} from '@/hooks/useGsapAnimations';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api';
import { Event } from '@/types';
import styles from './LandingPage.module.css';

// ============================================
// Hero Section — Sequential Cascade Entrance
// ============================================

export function HeroSection() {
  const heroRef = useGsapHeroEntrance<HTMLElement>('.gsap-hero-anim');
  const heroImageRef = useGsapParallax<HTMLDivElement>(0.15, 'y');
  const { user, role } = useAuth();

  return (
    <section ref={heroRef} className={styles.hero}>
      <div className={styles.heroContent}>
        <span className={`${styles.heroLabel} gsap-hero-anim`}>Established Since 1921</span>
        <h1 className={`${styles.heroTitle} gsap-hero-anim`}>
          Connecting Our{' '}
          <span className={styles.heroTitleHighlight}>
            Heritage
          </span>
          ,{' '}
          <span className={styles.heroTitleItalic}>Building<br />Our Future</span>
        </h1>
        <p className={`${styles.heroSubtitle} gsap-hero-anim`}>
          A place where culture, commerce, and community come together. We're proud 
          to carry forward the KVO Nagpur legacy, empowering our future generations through 
          unity and shared values.
        </p>
        <div className={`${styles.heroCta} gsap-hero-anim`}>
          {user ? (
            <Link href={(role === 'admin' || role === 'committee') ? '/dashboard' : '/directory'} className={styles.ctaBtnPrimary}>
              {role === 'admin' || role === 'committee' ? 'Go to Dashboard' : 'Go to Directory'}
            </Link>
          ) : (
            <>
              <Link href="/login?tab=member" className={styles.ctaBtnPrimary}>
                Member Login
              </Link>
              <Link href="/login?tab=committee" className={styles.ctaBtnOutlinedHero}>
                Committee Login
              </Link>
            </>
          )}
        </div>
      </div>
      <div ref={heroImageRef} className={`${styles.heroImage} ${styles.parallaxImage}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/samaj.jpeg" alt="Heritage architecture of the KVO Nagpur community" />
      </div>
    </section>
  );
}

// ============================================
// History & Mission — Scroll-Driven Reveal
// ============================================

export function HistoryMissionSection() {
  const imageRef = useGsapParallax<HTMLDivElement>(0.18, 'y');
  const sectionRef = useGsapSectionFlow<HTMLElement>();
  const contentRef = useGsapStagger<HTMLDivElement>('.gsap-history-item', {
    stagger: 0.15,
    duration: 0.9,
    distance: 30,
  });

  // Counter refs for each stat
  const membersRef = useGsapCounter<HTMLDivElement>(500, '+');
  const chaptersRef = useGsapCounter<HTMLDivElement>(120);
  const legacyRef = useGsapCounter<HTMLDivElement>(100);

  return (
    <section ref={sectionRef} className={styles.historySection}>
      <div className={styles.historySectionInner} id="history">
        <div ref={imageRef} className={`${styles.historyImage} ${styles.parallaxImageContainer}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/samaj_entrance.jpeg" alt="Historical photograph of community founders" className={styles.parallaxInnerImage} />
        </div>
        <div ref={contentRef} className={styles.historyContent}>
          <p className={`${styles.historyLabel} gsap-history-item`}>Our Roots</p>
          <h2 className={`${styles.historyTitle} gsap-history-item`}>History &amp; Mission</h2>
          <p className={`${styles.historyText} gsap-history-item`}>
            Built on resilience and shared success, KVO Nagpur has been our community's anchor 
            for over a century. Our ancestors travelled from the arid plains of Kutch to thrive 
            in global commerce, carrying our values with them.
          </p>
          <p className={`${styles.historyText} gsap-history-item`}>
            Today, our mission is simple: to celebrate our rich cultural heritage while creating 
            a modern space where members can grow professionally, support one another, and find 
            spiritual grounding.
          </p>
          <div className={`${styles.historyStats} gsap-history-item`}>
            <div className={styles.statItem}>
              <div ref={membersRef} className={styles.statValue}>0</div>
              <div className={styles.statLabel}>Active Members</div>
            </div>
            <div className={styles.statItem}>
              <div ref={chaptersRef} className={styles.statValue}>0</div>
              <div className={styles.statLabel}>Global Chapters</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>
                <span ref={legacyRef}>0</span>
                <span className={styles.statSuffix}>yr</span>
              </div>
              <div className={styles.statLabel}>Legacy</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// Achievements — Bento Grid with Stagger
// ============================================

export function AchievementsSection() {
  const { user } = useAuth();
  const sectionRef = useGsapSectionFlow<HTMLElement>();
  const gridRef = useGsapStagger<HTMLDivElement>('.gsap-bento-card', {
    stagger: 0.18,
    duration: 0.9,
    distance: 40,
  });
  const bannerRef = useGsapParallax<HTMLDivElement>(0.12, 'y');

  if (!user) return null;

  return (
    <section ref={sectionRef} id="archives" className={styles.achievementsSection}>
      <div className={styles.achievementsSectionInner}>
        <h2 className={styles.achievementsTitle}>Archives</h2>
        <p className={styles.achievementsSubtitle}>
          Celebrating the individuals whose contributions and lasting impact continue to inspire our community.
        </p>
        <div ref={gridRef} className={styles.bentoGrid}>
          {/* Card 1 - Top Left */}
          <div className={`${styles.bentoCard} gsap-bento-card`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.bentoCardImage} src="/images/samaj_plaque.jpeg" alt="Excellence in Education Grant" />
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
          <div className={`${styles.bentoCard} gsap-bento-card`}>
            <span className={styles.bentoCardLabel}>Entrepreneurial Spirit</span>
            <h3 className={styles.bentoCardTitle}>Entrepreneurial Spirit</h3>
            <p className={styles.bentoCardText}>
              Celebrating the builders in our community who are starting businesses, creating jobs, 
              and strengthening our shared legacy.
            </p>
            <a href="#" className={styles.bentoCardLink}>
              View Stories <ArrowRight size={14} />
            </a>
          </div>
          {/* Banner - Right column spanning both rows */}
          <div ref={bannerRef} className={`${styles.bentoBanner} ${styles.parallaxBanner} gsap-bento-card`}>
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

// ============================================
// Events — Cards with Progressive Stagger
// ============================================

export function EventsSection() {
  const { toast } = useToast();
  const { user } = useAuth();
  const sectionRef = useGsapSectionFlow<HTMLElement>();
  const headerRef = useGsapStagger<HTMLDivElement>('.gsap-events-header', {
    stagger: 0.15,
    duration: 0.8,
  });
  const cardsContainerRef = useGsapStagger<HTMLDivElement>('.gsap-stagger-card', {
    stagger: 0.15,
    duration: 0.85,
    distance: 40,
  });
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      ApiClient.get<Event[]>('/events')
        .then((data: Event[]) => {
          setEvents((data || []).slice(0, 3));
          setLoading(false);
        })
        .catch((err: Error) => {
          console.error('Failed to load events:', err);
          setLoading(false);
        });
    }
  }, [user]);

  if (!user) return null;
  
  return (
    <section ref={sectionRef} className={styles.eventsSection}>
      <div className={styles.eventsSectionInner}>
        <div ref={headerRef} className={styles.eventsHeader}>
          <div>
            <h2 className={`${styles.eventsTitle} gsap-events-header`}>Upcoming Events</h2>
            <p className={`${styles.eventsSubtitle} gsap-events-header`}>
              Come join us! Reconnect with friends, meet new people, and celebrate our community together.
            </p>
          </div>
        </div>
        
        {loading ? (
          <p style={{ color: 'var(--color-text-muted)' }}>Loading upcoming events...</p>
        ) : events.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>No upcoming events scheduled right now.</p>
        ) : (
          <div ref={cardsContainerRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', width: '100%' }}>
            {events.map((event: Event) => {
              const eventDate = new Date(event.date);
              const day = eventDate.getDate();
              const month = eventDate.toLocaleString('default', { month: 'short' });
              
              return (
                <div key={event.id} className={`${styles.eventCard} gsap-stagger-card`}>
                  <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 className={styles.eventCardTitle}>{event.title}</h3>
                    <p className={styles.eventCardLocation} style={{ marginTop: '8px', marginBottom: 'auto' }}>
                      {event.location || 'Location TBA'}
                      {event.time && ` • ${event.time}`}
                    </p>
                    
                    <div className={styles.eventCardActions} style={{ marginTop: '24px' }}>
                      <div className={styles.eventDate}>
                        <div className={styles.eventDateDay}>{day}</div>
                        <div className={styles.eventDateMonth}>{month}</div>
                      </div>
                      <button className={styles.registerBtn} onClick={() => toast('Registration successful! You will receive a confirmation SMS.', 'success')}>
                        Register
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================
// CTA Banner — Final Attention Focus
// ============================================

export function CTABanner() {
  const sectionRef = useGsapSectionFlow<HTMLElement>();
  const contentRef = useGsapStagger<HTMLDivElement>('.gsap-cta-item', {
    stagger: 0.18,
    duration: 1,
    distance: 30,
  });
  const { user } = useAuth();

  const handleScrollToTop = () => {
    const startY = window.scrollY;
    const duration = 1200;
    let startTime: number | null = null;
    
    const easeInOutCubic = (t: number, b: number, c: number, d: number) => {
      t /= d / 2;
      if (t < 1) return c / 2 * t * t * t + b;
      t -= 2;
      return c / 2 * (t * t * t + 2) + b;
    };

    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const nextY = easeInOutCubic(timeElapsed, startY, -startY, duration);
      
      window.scrollTo(0, nextY);
      
      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      } else {
        window.scrollTo(0, 0);
      }
    };
    
    requestAnimationFrame(animation);
  };

  return (
    <section ref={sectionRef} className={styles.ctaBanner}>
      <div ref={contentRef}>
        <h2 className={`${styles.ctaTitle} gsap-cta-item`}>Ready to Shape Our Future?</h2>
        <p className={`${styles.ctaSubtitle} gsap-cta-item`}>
          Join KVO Nagpur today. Connect with a worldwide network of members, share your journey, 
          and help us build something special.
        </p>
        <div className={`${styles.ctaActions} gsap-cta-item`}>
          {!user && (
            <button
              onClick={handleScrollToTop}
              className={styles.ctaBtnOutlined}
              style={{ textDecoration: 'none', cursor: 'pointer' }}
            >
              Login
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
