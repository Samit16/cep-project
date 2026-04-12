import { Suspense } from 'react';
import Navbar from '@/components/layout/Navbar/Navbar';
import Footer from '@/components/layout/Footer/Footer';
import LoginPage from '@/components/auth/LoginPage';

export default function LoginRoute() {
  return (
    <>
      <Navbar variant="public" />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <LoginPage />
      </Suspense>
      <Footer />
    </>
  );
}
