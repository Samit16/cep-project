import Navbar from '@/components/layout/Navbar/Navbar';
import Footer from '@/components/layout/Footer/Footer';
import DirectoryPage from '@/components/directory/DirectoryPage';

export const dynamic = 'force-dynamic';

export default function DirectoryRoute() {
  return (
    <>
      <Navbar variant="public" activeLink="directory" />
      <DirectoryPage />
      <Footer />
    </>
  );
}
