'use client';

import Navbar from '@/components/layout/Navbar/Navbar';
import Footer from '@/components/layout/Footer/Footer';
import ArchivesPage from '@/components/archives/ArchivesPage';

export default function ArchivesRoute() {
  return (
    <>
      <Navbar variant="public" activeLink="archives" />
      <ArchivesPage />
      <Footer />
    </>
  );
}

