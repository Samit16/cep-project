'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

// ============================================
// Shared Utilities
// ============================================

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}


export function useGsapReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;

      // Animate the container itself
      gsap.fromTo(el,
        { y: 40, opacity: 0 },
        {
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
        }
      );
    },
    { scope: ref }
  );

  return ref;
}

// ============================================
// 2. Layered Stagger Reveal
//    Children animate in sequence with
//    increasing delay — headline first,
//    body second, CTA last.
// ============================================

/**
 * Stagger children elements with a cascading reveal.
 * Each child slides up and fades in with a slight
 * delay after the previous, creating reading rhythm.
 */
export function useGsapStagger<T extends HTMLElement = HTMLDivElement>(
  childSelector: string,
  options?: { stagger?: number; duration?: number; distance?: number }
) {
  const ref = useRef<T>(null);
  const { stagger = 0.12, duration = 0.8, distance = 35 } = options || {};

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;

      const children = gsap.utils.toArray(childSelector, el);
      if (children.length === 0) return;

      gsap.fromTo(children,
        { y: distance, opacity: 0 },
        {
          scrollTrigger: {
            trigger: el,
            start: 'top 82%',
            toggleActions: 'play none none none',
          },
          y: 0,
          opacity: 1,
          duration,
          stagger,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
        }
      );
    },
    { scope: ref }
  );

  return ref;
}

// ============================================
// 3. Hero Entrance — Sequential Cascade
//    For above-the-fold content that should
//    animate on load (not scroll-triggered).
//    Label → Title → Subtitle → CTA with
//    deliberate pacing.
// ============================================

/**
 * Entrance animation for hero sections.
 * Triggers on page load with intentional stagger
 * to guide the eye: badge → title → description → buttons.
 */
export function useGsapHeroEntrance<T extends HTMLElement = HTMLDivElement>(
  childSelector: string = '.gsap-hero-anim'
) {
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;

      const children = gsap.utils.toArray(childSelector, el);
      if (children.length === 0) return;

      // Set initial state immediately to prevent flash
      gsap.set(children, { y: 45, opacity: 0 });

      // Cascade with deliberate timing
      gsap.to(children, {
        y: 0,
        opacity: 1,
        duration: 1,
        stagger: 0.2,
        ease: 'expo.out',
        delay: 0.3,
        clearProps: 'transform,opacity',
      });
    },
    { scope: ref }
  );

  return ref;
}

// ============================================
// 4. Text Line Reveal
//    Wraps each line in a clip-path mask
//    and reveals them sequentially for a
//    cinematic reading experience.
// ============================================

/**
 * Line-by-line text reveal using translateY and opacity
 * within an overflow-hidden wrapper. Creates a clean,
 * editorial feel without harsh motion.
 */
export function useGsapTextReveal<T extends HTMLElement = HTMLDivElement>(
  lineSelector: string = '.gsap-text-line'
) {
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;

      const lines = gsap.utils.toArray(lineSelector, el);
      if (lines.length === 0) return;

      gsap.fromTo(lines,
        { y: '100%', opacity: 0 },
        {
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
          y: '0%',
          opacity: 1,
          duration: 0.7,
          stagger: 0.08,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
        }
      );
    },
    { scope: ref }
  );

  return ref;
}

// ============================================
// 5. Scroll-Driven Parallax
//    Smooth depth via scrubbed translation
//    and subtle scale. Creates visual layers.
// ============================================

/**
 * Parallax depth effect. Background elements move
 * slower than foreground, creating immersion.
 * Uses scrub for buttery-smooth scroll binding.
 */
export function useGsapParallax<T extends HTMLElement = HTMLDivElement>(
  speedMultiplier: number = 0.5,
  direction: 'y' | 'x' = 'y'
) {
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;

      gsap.fromTo(el,
        { [direction]: 0, scale: 1.03 },
        {
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2,
          },
          [direction]: -80 * speedMultiplier,
          scale: 1,
          ease: 'none',
        }
      );
    },
    { scope: ref }
  );

  return ref;
}

// ============================================
// 6. Section Transition Overlap
//    Makes consecutive sections slightly
//    overlap their entrance animations,
//    creating a sense of continuous flow
//    rather than isolated blocks.
// ============================================

/**
 * Creates overlap between sections: this section
 * begins its reveal while the previous is still
 * finishing, creating fluid scroll progression.
 */
export function useGsapSectionFlow<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;

      gsap.fromTo(el,
        { y: 60, opacity: 0 },
        {
          scrollTrigger: {
            trigger: el,
            start: 'top 92%',  // Start earlier for overlap
            end: 'top 60%',
            scrub: 0.8,        // Scrub ties motion to scroll position
          },
          y: 0,
          opacity: 1,
          ease: 'power2.out',
        }
      );
    },
    { scope: ref }
  );

  return ref;
}

// ============================================
// 7. Card Hover Morph
//    Smooth state transition on hover —
//    lift, shadow expansion, and subtle scale.
//    Uses paused tweens for instant reversibility.
// ============================================

export function useGsapHover<T extends HTMLElement = HTMLDivElement>(
  scaleMultiplier: number = 1.02
) {
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const hoverTween = gsap.to(el, {
        scale: scaleMultiplier,
        y: -6,
        boxShadow: '0 16px 32px -8px rgba(0, 0, 0, 0.1), 0 6px 12px -4px rgba(0, 0, 0, 0.06)',
        duration: 0.45,
        ease: 'power3.out',
        paused: true,
      });

      const onEnter = () => hoverTween.play();
      const onLeave = () => hoverTween.reverse();

      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);

      return () => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
        hoverTween.kill();
      };
    },
    { scope: ref }
  );

  return ref;
}

// ============================================
// 8. Button Click Feedback
//    Satisfying press-and-release with
//    elastic physics for tactile feel.
// ============================================

export function useGsapClick<T extends HTMLElement = HTMLButtonElement>() {
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const onClick = () => {
        gsap.fromTo(el,
          { scale: 0.94 },
          { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.35)' }
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

// ============================================
// 9. Navbar Scroll Behavior
//    Hide on scroll down, reveal on scroll up
//    with frosted glass background treatment.
// ============================================

export function useGsapNavbar<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;

      const showAnim = gsap.from(el, {
        yPercent: -100,
        paused: true,
        duration: 0.35,
        ease: 'power3.out',
      }).progress(1);

      ScrollTrigger.create({
        start: 'top top',
        end: 99999,
        onUpdate: (self) => {
          if (self.direction === -1) {
            showAnim.play();
            gsap.to(el, {
              backgroundColor: 'rgba(253, 251, 248, 0.95)',
              backdropFilter: 'blur(8px)',
              duration: 0.3,
            });
          } else if (self.direction === 1 && self.scroll() > 50) {
            showAnim.reverse();
          }
        },
      });
    },
    { scope: ref }
  );

  return ref;
}

// ============================================
// 10. Universal Interaction Layer
//     Auto-discovers buttons and cards within
//     a scope and applies hover/click morphs.
//     Full cleanup on unmount.
// ============================================

export function useGsapInteractions<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const parent = ref.current;
      if (!parent || prefersReducedMotion()) return;

      const cleanups: (() => void)[] = [];

      // --- Buttons ---
      const btns = gsap.utils.toArray<HTMLElement>(
        'button, a[class*="Btn"], a[class*="btn"], .btn', parent
      );
      btns.forEach((btn) => {
        const hoverAnim = gsap.to(btn, {
          scale: 1.04,
          y: -2,
          boxShadow: '0 8px 16px -8px rgba(0,0,0,0.12)',
          duration: 0.35,
          ease: 'power3.out',
          paused: true,
        });

        const enter = () => hoverAnim.play();
        const leave = () => hoverAnim.reverse();
        const down = () => gsap.to(btn, { scale: 0.96, duration: 0.08, ease: 'power2.out' });
        const up = () => gsap.to(btn, { scale: 1.04, duration: 0.5, ease: 'elastic.out(1, 0.4)' });

        btn.addEventListener('mouseenter', enter);
        btn.addEventListener('mouseleave', leave);
        btn.addEventListener('mousedown', down);
        btn.addEventListener('mouseup', up);

        cleanups.push(() => {
          btn.removeEventListener('mouseenter', enter);
          btn.removeEventListener('mouseleave', leave);
          btn.removeEventListener('mousedown', down);
          btn.removeEventListener('mouseup', up);
          hoverAnim.kill();
        });
      });

      // --- Cards ---
      const cards = gsap.utils.toArray<HTMLElement>(
        '[class*="Card"], [class*="card"]', parent
      );
      cards.forEach((card) => {
        gsap.set(card, { transformPerspective: 800 });

        const hoverAnim = gsap.to(card, {
          y: -6,
          scale: 1.015,
          boxShadow: '0 20px 40px -12px rgba(0,0,0,0.1), 0 8px 16px -8px rgba(0,0,0,0.06)',
          duration: 0.45,
          ease: 'expo.out',
          paused: true,
        });

        const enter = () => hoverAnim.play();
        const leave = () => hoverAnim.reverse();

        card.addEventListener('mouseenter', enter);
        card.addEventListener('mouseleave', leave);

        cleanups.push(() => {
          card.removeEventListener('mouseenter', enter);
          card.removeEventListener('mouseleave', leave);
          hoverAnim.kill();
        });
      });

      return () => {
        cleanups.forEach((fn) => fn());
      };
    },
    { scope: ref }
  );

  return ref;
}

// ============================================
// 11. Stat Counter Animation
//     Animates numbers from 0 to target value
//     when scrolled into view. Creates the
//     "impact" moment for stats sections.
// ============================================

export function useGsapCounter<T extends HTMLElement = HTMLDivElement>(
  targetValue: number,
  suffix: string = ''
) {
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;

      const obj = { val: 0 };

      gsap.to(obj, {
        val: targetValue,
        duration: 1.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        onUpdate: () => {
          el.textContent = Math.round(obj.val) + suffix;
        },
      });
    },
    { scope: ref }
  );

  return ref;
}
