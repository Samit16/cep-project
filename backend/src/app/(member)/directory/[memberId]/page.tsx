import Navbar from '@/components/layout/Navbar/Navbar';
import Footer from '@/components/layout/Footer/Footer';
import ProfilePage from '@/components/profile/ProfilePage';

export default function ProfileRoute({ params }: { params: { memberId: string } }) {
  return (
    <>
      <Navbar variant="public" activeLink="directory" />
      <ProfilePage memberId={params.memberId} />
      <Footer />
    </>
  );
}
