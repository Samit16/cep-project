import { Suspense } from 'react';
import AdminDashboard from '@/components/admin/AdminDashboard';

export default function DashboardRoute() {
  return (
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}>Loading Workspace...</div>}>
      <AdminDashboard />
    </Suspense>
  );
}
