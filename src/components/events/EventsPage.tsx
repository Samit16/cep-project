'use client';

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar/Navbar';
import Footer from '@/components/layout/Footer/Footer';
import { MapPin, Clock, Info, Phone } from 'lucide-react';
import { mockEvents } from '@/data/mock';
import styles from './EventsPage.module.css';

export default function EventsPage() {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  return (
    <>
      <Navbar variant="public" />
      <main className={styles.eventsWrapper}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>Community <span className={styles.italic}>Gatherings</span></h1>
            <p className={styles.subtitle}>
              Celebrate our culture, network with professionals, and stay connected with the Samaj through our curated events.
            </p>
          </div>
        </section>

        <section className={styles.filterSection}>
          <div className={styles.filterBar}>
            <button 
              className={`${styles.filterBtn} ${filter === 'all' ? styles.filterBtnActive : ''}`}
              onClick={() => setFilter('all')}
            >
              All Events
            </button>
            <button 
              className={`${styles.filterBtn} ${filter === 'upcoming' ? styles.filterBtnActive : ''}`}
              onClick={() => setFilter('upcoming')}
            >
              Upcoming
            </button>
            <button 
              className={`${styles.filterBtn} ${filter === 'past' ? styles.filterBtnActive : ''}`}
              onClick={() => setFilter('past')}
            >
              Past Events
            </button>
          </div>
        </section>

        <section className={styles.eventsGrid}>
          <div className={styles.gridInner}>
            {mockEvents.map((event) => (
              <div key={event.id} className={styles.eventCard}>
                <div className={styles.eventImage}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={event.imageUrl || `/images/events/event${event.id}.png`} alt={event.title} />
                  <div className={styles.eventDateBadge}>
                    <span className={styles.day}>{new Date(event.date).getDate()}</span>
                    <span className={styles.month}>{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                  </div>
                </div>
                <div className={styles.eventContent}>
                  <h3 className={styles.eventTitle}>{event.title}</h3>
                  <div className={styles.eventMeta}>
                    <div className={styles.metaItem}>
                      <Clock size={14} /> {event.time}
                    </div>
                    <div className={styles.metaItem}>
                      <MapPin size={14} /> {event.location}
                    </div>
                  </div>
                  <p className={styles.eventDescription}>{event.description}</p>
                  
                  {event.importantNotes && (
                    <div className={styles.notes}>
                      <Info size={14} /> {event.importantNotes}
                    </div>
                  )}

                  <div className={styles.eventFooter}>
                    <div className={styles.contacts}>
                      {event.committeeContacts.slice(0, 1).map((contact, i) => (
                        <div key={i} className={styles.contact}>
                          <Phone size={12} /> {contact.name}: {contact.phone}
                        </div>
                      ))}
                    </div>
                    <button className={styles.registerBtn} onClick={() => alert('Registration successful! You will receive a confirmation SMS.')}>
                      Register Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
