'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function Template({ children }: { children: React.ReactNode }) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Check prefers-reduced-motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      gsap.from(container.current, {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out',
        clearProps: 'all' // Cleanup after animation
      });
    },
    { scope: container }
  );

  return (
    <div ref={container} style={{ willChange: 'transform, opacity' }}>
      {children}
    </div>
  );
}
