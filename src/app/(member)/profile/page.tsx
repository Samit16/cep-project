import Navbar from '@/components/layout/Navbar/Navbar';
import Footer from '@/components/layout/Footer/Footer';
import ProfilePage from '@/components/profile/ProfilePage';

export const metadata = {
  title: 'My Profile — KVO Nagpur',
  description: 'View and manage your KVO Nagpur member profile, personal details, and privacy settings.',
};

export default function ProfileRoute() {
  return (
    <>
      <Navbar variant="public" />
      <ProfilePage />
      <Footer />
    </>
  );
}
