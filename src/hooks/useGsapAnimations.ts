'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

/**
 * Hook for scroll-triggered reveal animations.
 * Features: fade-in & slide-up on enter.
 */
export function useGsapReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      gsap.from(el, {
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
        },
        y: 32,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        clearProps: 'all' // clean up inline styles
      });
    },
    { scope: ref }
  );

  return ref;
}

/**
 * Hook for staggering children elements dynamically using GSAP.
 */
export function useGsapStagger<T extends HTMLElement = HTMLDivElement>(childSelector: string) {
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      gsap.from(gsap.utils.toArray(childSelector, el), {
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
        },
        y: 24,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        clearProps: 'all'
      });
    },
    { scope: ref }
  );

  return ref;
}

/**
 * Hook for parallax effects (replaces useParallax).
 * GSAP ScrollTrigger based parallax.
 */
export function useGsapParallax<T extends HTMLElement = HTMLDivElement>(speedMultiplier: number = 0.5, direction: 'y' | 'x' = 'y') {
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      gsap.to(el, {
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
        [direction]: (i, target) => -100 * speedMultiplier,
        ease: 'none'
      });
    },
    { scope: ref }
  );

  return ref;
}

/**
 * Hook for hover animations using GSAP.
 */
export function useGsapHover<T extends HTMLElement = HTMLDivElement>(scaleMultiplier: number = 1.02) {
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const hoverTween = gsap.to(el, {
        scale: scaleMultiplier,
        y: -4,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        duration: 0.3,
        ease: 'power2.out',
        paused: true,
      });

      const onMouseEnter = () => hoverTween.play();
      const onMouseLeave = () => hoverTween.reverse();

      el.addEventListener('mouseenter', onMouseEnter);
      el.addEventListener('mouseleave', onMouseLeave);

      return () => {
        el.removeEventListener('mouseenter', onMouseEnter);
        el.removeEventListener('mouseleave', onMouseLeave);
        hoverTween.kill();
      };
    },
    { scope: ref }
  );

  return ref;
}

/**
 * Hook for button click animations
 */
export function useGsapClick<T extends HTMLElement = HTMLButtonElement>() {
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const onClick = () => {
        gsap.fromTo(el, 
          { scale: 0.95 }, 
          { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.3)' }
        );
      };

      el.addEventListener('click', onClick);
      return () => el.removeEventListener('click', onClick);
    },
    { scope: ref }
  );

  return ref;
}

/**
 * Hook for Navbar scroll-based animations (hide on scroll down, show on scroll up)
 */
export function useGsapNavbar<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      const showAnim = gsap.from(el, { 
        yPercent: -100,
        paused: true,
        duration: 0.3,
        ease: 'power2.out'
      }).progress(1);

      ScrollTrigger.create({
        start: "top top",
        end: 99999,
        onUpdate: (self) => {
          if (self.direction === -1) {
            showAnim.play();
            gsap.to(el, { backgroundColor: 'rgba(253, 251, 248, 0.95)', backdropFilter: 'blur(8px)', duration: 0.3 });
          } else if (self.direction === 1 && self.scroll() > 50) {
            showAnim.reverse();
          }
        }
      });
    },
    { scope: ref }
  );
  
  return ref;
}

/**
 * Hook to apply interaction animations (hover/click) universally using clean class selectors.
 * Connects to buttons and cards.
 */
export function useGsapInteractions<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const parent = ref.current;
      if (!parent) return;

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      const btns = gsap.utils.toArray<HTMLElement>('button, a[class*="Btn"], .btn', parent);
      btns.forEach((btn) => {
        const hoverAnim = gsap.to(btn, { scale: 1.04, y: -2, duration: 0.25, ease: 'power2.out', paused: true });
        
        btn.addEventListener('mouseenter', () => hoverAnim.play());
        btn.addEventListener('mouseleave', () => hoverAnim.reverse());
        btn.addEventListener('mousedown', () => gsap.to(btn, { scale: 0.96, duration: 0.1 }));
        btn.addEventListener('mouseup', () => gsap.to(btn, { scale: 1.04, duration: 0.4, ease: 'elastic.out(1, 0.4)' }));
      });

      const cards = gsap.utils.toArray<HTMLElement>('[class*="Card"]', parent);
      cards.forEach((card) => {
        const hoverAnim = gsap.to(card, { 
          y: -4, 
          scale: 1.01, 
          boxShadow: '0 12px 24px rgba(0,0,0,0.08)',
          duration: 0.3, 
          ease: 'power2.out', 
          paused: true 
        });
        card.addEventListener('mouseenter', () => hoverAnim.play());
        card.addEventListener('mouseleave', () => hoverAnim.reverse());
      });
    },
    { scope: ref }
  );

  return ref;
}
