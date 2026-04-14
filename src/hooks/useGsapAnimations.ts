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

      gsap.fromTo(el, 
        { y: 50, opacity: 0, scale: 0.98 },
        {
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
          },
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1.2,
          ease: 'expo.out',
          clearProps: 'all'
        }
      );
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

      gsap.fromTo(gsap.utils.toArray(childSelector, el), 
        { y: 40, opacity: 0, scale: 0.95 },
        {
          scrollTrigger: {
            trigger: el,
            start: 'top 80%',
          },
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1,
          stagger: 0.15,
          ease: 'power3.out',
          clearProps: 'all'
        }
      );
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

      // Wrap parallax in a subtle scale to give depth perception
      gsap.fromTo(el,
        { scale: 1.05 },
        {
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.5, // Added smoothing scrub for premium feel
          },
          scale: 1,
          [direction]: -100 * speedMultiplier,
          ease: 'power1.inOut'
        }
      );
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
      return () => {
        el.removeEventListener('click', onClick);
      };
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
      const btnCleanups: (() => void)[] = [];

      btns.forEach((btn) => {
        const hoverAnim = gsap.to(btn, { 
          scale: 1.05, 
          y: -2, 
          boxShadow: '0 10px 20px -10px rgba(0,0,0,0.15)',
          duration: 0.4, 
          ease: 'power3.out', 
          paused: true 
        });
        
        const enter = () => hoverAnim.play();
        const leave = () => hoverAnim.reverse();
        const down = () => gsap.to(btn, { scale: 0.94, duration: 0.1, ease: 'power2.out' });
        const up = () => gsap.to(btn, { scale: 1.05, duration: 0.6, ease: 'elastic.out(1, 0.4)' });

        btn.addEventListener('mouseenter', enter);
        btn.addEventListener('mouseleave', leave);
        btn.addEventListener('mousedown', down);
        btn.addEventListener('mouseup', up);

        btnCleanups.push(() => {
          btn.removeEventListener('mouseenter', enter);
          btn.removeEventListener('mouseleave', leave);
          btn.removeEventListener('mousedown', down);
          btn.removeEventListener('mouseup', up);
        });
      });

      const cards = gsap.utils.toArray<HTMLElement>('[class*="Card"], [class*="card"]', parent);
      const cardCleanups: (() => void)[] = [];

      cards.forEach((card) => {
        gsap.set(card, { transformPerspective: 1000 });
        
        const hoverAnim = gsap.to(card, { 
          y: -8, 
          scale: 1.02, 
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.12), 0 8px 16px -8px rgba(0,0,0,0.08)',
          duration: 0.5, 
          ease: 'expo.out', 
          paused: true 
        });

        const enter = () => hoverAnim.play();
        const leave = () => hoverAnim.reverse();

        card.addEventListener('mouseenter', enter);
        card.addEventListener('mouseleave', leave);

        cardCleanups.push(() => {
          card.removeEventListener('mouseenter', enter);
          card.removeEventListener('mouseleave', leave);
        });
      });

      return () => {
        btnCleanups.forEach(c => c());
        cardCleanups.forEach(c => c());
      };
    },
    { scope: ref }
  );

  return ref;
}
