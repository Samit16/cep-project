import Navbar from '@/components/layout/Navbar/Navbar';
import Footer from '@/components/layout/Footer/Footer';
import { HeroSection, HistoryMissionSection, AchievementsSection, EventsSection, CTABanner } from '@/components/landing/LandingPage';

export default function HomePage() {
  return (
    <>
      <Navbar variant="public" />
      <HeroSection />
      <HistoryMissionSection />
      <AchievementsSection />
      <EventsSection />
      <CTABanner />
      <Footer />
    </>
  );
}
