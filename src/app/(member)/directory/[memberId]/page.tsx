import Navbar from '@/components/layout/Navbar/Navbar';
import Footer from '@/components/layout/Footer/Footer';
import ProfilePage from '@/components/profile/ProfilePage';

export default async function ProfileRoute({ params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  return (
    <>
      <Navbar variant="public" activeLink="directory" />
      <ProfilePage memberId={memberId} />
      <Footer />
    </>
  );
}
