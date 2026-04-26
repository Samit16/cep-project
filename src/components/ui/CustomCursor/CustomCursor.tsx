'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import styles from './CustomCursor.module.css';

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const [isVisible, setIsVisible] = useState(false);
  const [isPointerFine, setIsPointerFine] = useState(false);

  // Keep track of active hover target to avoid weird physics
  const hoverTarget = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(pointer: fine)');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsPointerFine(mediaQuery.matches);
    
    const updatePointerStatus = (e: MediaQueryListEvent) => {
      setIsPointerFine(e.matches);
    };
    
    mediaQuery.addEventListener('change', updatePointerStatus);
    return () => mediaQuery.removeEventListener('change', updatePointerStatus);
  }, []);

  useEffect(() => {
    if (!isPointerFine) {
      document.body.classList.remove('has-custom-cursor');
      return;
    }

    document.body.classList.add('has-custom-cursor');

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Fast tracking for the dot
    const xDotTo = gsap.quickTo(dot, 'x', { duration: 0.05, ease: 'power3.out' });
    const yDotTo = gsap.quickTo(dot, 'y', { duration: 0.05, ease: 'power3.out' });

    // Slower tracking for the ring to create the "lag" effect
    const xRingTo = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power3.out' });
    const yRingTo = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power3.out' });

    const onMouseMove = (e: MouseEvent) => {
      setIsVisible(true);
      xDotTo(e.clientX);
      yDotTo(e.clientY);
      xRingTo(e.clientX);
      yRingTo(e.clientY);
    };

    const handleMouseLeave = () => setIsVisible(false);

    const checkInteractive = (target: HTMLElement) => {
      return target.closest('a, button, input, select, textarea, [role="button"], label, .interactive');
    };

    const onMouseOver = (e: MouseEvent) => {
      const interactiveEl = checkInteractive(e.target as HTMLElement);
      if (interactiveEl && hoverTarget.current !== interactiveEl) {
        hoverTarget.current = interactiveEl as HTMLElement;
        // Dot disappears
        gsap.to(dot, { scale: 0, opacity: 0, duration: 0.2 });
        // Ring expands and gains subtle bg
        gsap.to(ring, { 
          scale: 1.6, 
          backgroundColor: 'rgba(139, 26, 26, 0.08)',
          borderColor: 'transparent',
          duration: 0.3,
          ease: 'power2.out' 
        });
      } else if (!interactiveEl && hoverTarget.current) {
        hoverTarget.current = null;
        // Revert to normal
        gsap.to(dot, { scale: 1, opacity: 1, duration: 0.2 });
        gsap.to(ring, { 
          scale: 1, 
          backgroundColor: 'transparent', 
          borderColor: 'rgba(139, 26, 26, 0.4)',
          duration: 0.3,
          ease: 'power2.out' 
        });
      }
    };

    const onMouseDown = () => {
      if (hoverTarget.current) {
        // If hovering over button, shrink ring slightly on click
        gsap.to(ring, { scale: 1.4, duration: 0.1, ease: 'power2.out' });
      } else {
        // Normal click: shrink ring & dot
        gsap.to(ring, { scale: 0.8, duration: 0.1 });
        gsap.to(dot, { scale: 0.8, duration: 0.1 });
      }
    };

    const onMouseUp = () => {
      if (hoverTarget.current) {
        gsap.to(ring, { scale: 1.6, duration: 0.2, ease: 'back.out(1.5)' });
      } else {
        gsap.to(ring, { scale: 1, duration: 0.3, ease: 'back.out(1.5)' });
        gsap.to(dot, { scale: 1, duration: 0.3, ease: 'back.out(1.5)' });
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mouseover', onMouseOver);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mouseover', onMouseOver);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.classList.remove('has-custom-cursor');
    };
  }, [isPointerFine]);

  if (!isPointerFine) return null;

  return (
    <>
      <div ref={ringRef} className={`${styles.cursorRing} ${isVisible ? styles.visible : ''}`} />
      <div ref={dotRef} className={`${styles.cursorDot} ${isVisible ? styles.visible : ''}`} />
    </>
  );
}
