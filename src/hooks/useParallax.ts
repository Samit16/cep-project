'use client';

import { useEffect, useRef, useCallback } from 'react';

interface ParallaxOptions {
  /** Speed multiplier: 0 = no movement, 0.5 = half scroll speed, 1 = full scroll speed. Negative = opposite direction. */
  speed?: number;
  /** Direction of parallax movement */
  direction?: 'vertical' | 'horizontal';
  /** Only animate when element is in viewport (performance optimization) */
  viewportOnly?: boolean;
}


export function useParallax<T extends HTMLElement = HTMLDivElement>(
  options: ParallaxOptions = {}
) {
  const { speed = 0.3, direction = 'vertical', viewportOnly = true } = options;
  const ref = useRef<T>(null);
  const isVisible = useRef(true);
  const rafId = useRef<number>(0);
  const prefersReducedMotion = useRef(false);

  const updatePosition = useCallback(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion.current) return;
    if (viewportOnly && !isVisible.current) return;

    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    
    const elementCenter = rect.top + rect.height / 2;
    const viewportCenter = windowHeight / 2;
    const offset = (elementCenter - viewportCenter) * speed;

    el.style.setProperty('--parallax-offset', `${offset}px`);
  }, [speed, viewportOnly]);

  const onScroll = useCallback(() => {
    if (rafId.current) return; // Throttle to one rAF per frame
    rafId.current = requestAnimationFrame(() => {
      updatePosition();
      rafId.current = 0;
    });
  }, [updatePosition]);

  useEffect(() => {
    // Check reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotion.current = motionQuery.matches;

    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion.current = e.matches;
      if (e.matches && ref.current) {
        ref.current.style.setProperty('--parallax-offset', '0px');
      }
    };
    motionQuery.addEventListener('change', handleMotionChange);

    if (prefersReducedMotion.current) return;

    // IntersectionObserver for viewport gating
    let observer: IntersectionObserver | undefined;
    if (viewportOnly && ref.current) {
      observer = new IntersectionObserver(
        ([entry]) => {
          isVisible.current = entry.isIntersecting;
        },
        { rootMargin: '100px 0px' } // Start slightly before entering viewport
      );
      observer.observe(ref.current);
    }

    // Passive scroll listener for performance
    window.addEventListener('scroll', onScroll, { passive: true });
    // Initial position
    updatePosition();

    return () => {
      window.removeEventListener('scroll', onScroll);
      motionQuery.removeEventListener('change', handleMotionChange);
      if (observer) observer.disconnect();
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [onScroll, updatePosition, viewportOnly]);

  return ref;
}

/**
 * Hook for scroll-triggered fade-in / slide-up animations.
 * Uses IntersectionObserver — no scroll listener needed.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: { threshold?: number; rootMargin?: string } = {}
) {
  const { threshold = 0.15, rootMargin = '0px 0px -60px 0px' } = options;
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Check reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.opacity = '1';
      el.style.transform = 'none';
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('scroll-revealed');
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return ref;
}
