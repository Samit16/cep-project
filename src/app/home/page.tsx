import Navbar from '@/components/layout/Navbar/Navbar';
import Footer from '@/components/layout/Footer/Footer';
import { HeroSection, HistoryMissionSection, CTABanner } from '@/components/landing/LandingPage';

export default function HomePage() {
  return (
    <>
      <Navbar variant="public" />
      <HeroSection />
      <HistoryMissionSection />
      <CTABanner />
      <Footer />
    </>
  );
}
