'use client';

import React from 'react';
import Navbar from '@/components/layout/Navbar/Navbar';
import Footer from '@/components/layout/Footer/Footer';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import styles from './ContactPage.module.css';
import {
  useGsapHeroEntrance,
  useGsapStagger,
  useGsapSectionFlow,
} from '@/hooks/useGsapAnimations';

export default function ContactPage() {
  const heroRef = useGsapHeroEntrance<HTMLElement>('.gsap-contact-hero');
  const cardsRef = useGsapStagger<HTMLDivElement>('.gsap-contact-card', {
    stagger: 0.15,
    duration: 0.85,
    distance: 25,
  });
  const mapRef = useGsapSectionFlow<HTMLElement>();

  return (
    <>
      <Navbar variant="public" />
      <main className={styles.contactPage}>
        {/* Hero */}
        <section ref={heroRef} className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={`${styles.heroBadge} gsap-contact-hero`}>
              We&apos;re Here for You
            </span>
            <h1 className={`${styles.title} gsap-contact-hero`}>
              Get in <span className={styles.italic}>Touch</span>
            </h1>
            <p className={`${styles.subtitle} gsap-contact-hero`}>
              Whether you have a question, want to join the community, or just
              want to say hello &mdash; we&apos;d love to hear from you.
            </p>
          </div>
        </section>

        {/* Contact Cards */}
        <section className={styles.cardsSection}>
          <div ref={cardsRef} className={styles.cardsGrid}>
            {/* Phone */}
            <a href="tel:07122766217" className={`${styles.card} gsap-contact-card`}>
              <div className={styles.cardIconWrap}>
                <Phone size={22} />
              </div>
              <h3 className={styles.cardTitle}>Call Us</h3>
              <p className={styles.cardText}>
                Speak directly with our office during working hours.
              </p>
              <span className={styles.cardValue}>0712-2766217</span>
            </a>

            {/* Email */}
            <a href="mailto:shrinagpurkvosamaj@yahoo.com" className={`${styles.card} gsap-contact-card`}>
              <div className={styles.cardIconWrap}>
                <Mail size={22} />
              </div>
              <h3 className={styles.cardTitle}>Email Us</h3>
              <p className={styles.cardText}>
                Drop us a message and we&apos;ll get back to you soon.
              </p>
              <span className={styles.cardValue}>shrinagpurkvosamaj@yahoo.com</span>
            </a>

            {/* Address */}
            <div className={`${styles.card} gsap-contact-card`}>
              <div className={styles.cardIconWrap}>
                <MapPin size={22} />
              </div>
              <h3 className={styles.cardTitle}>Visit Us</h3>
              <address className={styles.cardAddress}>
                57/58, Anath Vidyarthi Gruh Lay-out,
                <br />
                Satnami Nagar, Lakadganj,
                <br />
                Nagpur &ndash; 440008
              </address>
            </div>

            {/* Office Hours */}
            <div className={`${styles.card} gsap-contact-card`}>
              <div className={styles.cardIconWrap}>
                <Clock size={22} />
              </div>
              <h3 className={styles.cardTitle}>Office Hours</h3>
              <p className={styles.cardText}>
                Monday &ndash; Saturday
                <br />
                <strong>10:00 AM &ndash; 6:00 PM</strong>
              </p>
              <span className={styles.cardMuted}>Sunday: Closed</span>
            </div>
          </div>
        </section>

        {/* Map */}
        <section ref={mapRef} className={styles.mapSection}>
          <h2 className={styles.mapTitle}>Find Us Here</h2>
          <div className={styles.mapWrapper}>
            <iframe
              title="KVO Nagpur — Satnami Nagar, Lakadganj, Nagpur"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3720.8!2d79.0755!3d21.1575!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bd4c1003fff67c7%3A0x5c6c0751fa2c3f68!2sLakadganj%2C%20Nagpur%2C%20Maharashtra%20440008!5e0!3m2!1sen!2sin!4v1713400000000"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
