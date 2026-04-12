'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast/ToastProvider';
import { useParallax, useScrollReveal } from '@/hooks/useParallax';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api';
import { Event } from '@/types';
import styles from './LandingPage.module.css';

export function HeroSection() {
  const heroImageRef = useParallax<HTMLDivElement>({ speed: 0.15 });
  const heroContentRef = useParallax<HTMLDivElement>({ speed: -0.08 });
  const { user, role } = useAuth();

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
  const { user } = useAuth();
  const titleRef = useScrollReveal<HTMLDivElement>();
  const bannerRef = useParallax<HTMLDivElement>({ speed: 0.12 });

  if (!user) return null;

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
  const { user } = useAuth();
  const sectionRef = useScrollReveal<HTMLElement>();
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
    <section ref={sectionRef} className={`${styles.eventsSection} ${styles.scrollReveal}`}>
      <div className={styles.eventsSectionInner}>
        <div className={styles.eventsHeader}>
          <div>
            <h2 className={styles.eventsTitle}>Upcoming Events</h2>
            <p className={styles.eventsSubtitle}>
              Join our community gatherings and celebrate your heritage together.
            </p>
          </div>
        </div>
        
        {loading ? (
          <p style={{ color: 'var(--color-text-muted)' }}>Loading upcoming events...</p>
        ) : events.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>No upcoming events scheduled right now.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', width: '100%' }}>
            {events.map((event: Event) => {
              const eventDate = new Date(event.date);
              const day = eventDate.getDate();
              const month = eventDate.toLocaleString('default', { month: 'short' });
              
              return (
                <div key={event.id} className={styles.eventCard}>
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

export function CTABanner() {
  const ctaRef = useScrollReveal<HTMLElement>();
  const { user } = useAuth();

  const handleScrollToTop = () => {
    const startY = window.scrollY;
    const duration = 1200; // 1.2s smooth roll up
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
        window.scrollTo(0, 0); // ensure perfect lock
      }
    };
    
    requestAnimationFrame(animation);
  };

  return (
    <section ref={ctaRef} className={`${styles.ctaBanner} ${styles.scrollReveal}`}>
      <h2 className={styles.ctaTitle}>Ready to Shape Our Tomorrow?</h2>
      <p className={styles.ctaSubtitle}>
        Join KVO Nagpur today. Gain access to a worldwide network and contribute
        to our community&apos;s lasting legacy.
      </p>
      <div className={styles.ctaActions}>
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
    </section>
  );
}
