'use client';

import { useGsapInteractions } from '@/hooks/useGsapAnimations';

export function GsapInteractionsProvider({ children }: { children: React.ReactNode }) {
  const ref = useGsapInteractions<HTMLDivElement>();

  return (
    <div ref={ref} style={{ width: '100%', height: '100%', display: 'contents' }}>
      {children}
    </div>
  );
}
