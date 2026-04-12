'use client';

import Navbar from '@/components/layout/Navbar/Navbar';
import Footer from '@/components/layout/Footer/Footer';
import { AchievementsSection, EventsSection } from '@/components/landing/LandingPage';

export default function ArchivesPage() {
  return (
    <>
      <Navbar variant="public" />
      <EventsSection />
      <AchievementsSection />
      <Footer />
    </>
  );
}
