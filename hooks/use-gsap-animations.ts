'use client';

import { useRef, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Check for reduced motion preference
export function usePrefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Staggered fade-in animation for children
export function useStaggerFadeIn(deps: any[] = []) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion || !containerRef.current) return;

    const children = containerRef.current.children;

    gsap.fromTo(
      children,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
      }
    );
  }, deps);

  return containerRef;
}

// Scroll-triggered reveal animation
export function useScrollReveal(options: {
  threshold?: number;
  y?: number;
  duration?: number;
  stagger?: number;
} = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const { threshold = 0.1, y = 40, duration = 0.8, stagger = 0.1 } = options;

  useEffect(() => {
    if (prefersReducedMotion || !ref.current) return;

    const element = ref.current;
    const children = element.children.length > 1 ? element.children : [element];

    gsap.set(children, { opacity: 0, y });

    const trigger = ScrollTrigger.create({
      trigger: element,
      start: `top ${100 - threshold * 100}%`,
      onEnter: () => {
        gsap.to(children, {
          opacity: 1,
          y: 0,
          duration,
          stagger,
          ease: 'power3.out',
        });
      },
      once: true,
    });

    return () => trigger.kill();
  }, [prefersReducedMotion, threshold, y, duration, stagger]);

  return ref;
}

// Hero text reveal animation
export function useHeroReveal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion || !containerRef.current) return;

    const tl = gsap.timeline();
    const container = containerRef.current;

    // Get elements by data attributes
    const badge = container.querySelector('[data-hero="badge"]');
    const title = container.querySelector('[data-hero="title"]');
    const subtitle = container.querySelector('[data-hero="subtitle"]');
    const cta = container.querySelector('[data-hero="cta"]');
    const code = container.querySelector('[data-hero="code"]');

    gsap.set([badge, title, subtitle, cta, code].filter(Boolean), {
      opacity: 0,
      y: 30,
    });

    tl.to(badge, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' })
      .to(title, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.3')
      .to(subtitle, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4')
      .to(cta, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.3')
      .to(code, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3');

    return () => {
      tl.kill();
    };
  }, [prefersReducedMotion]);

  return containerRef;
}

// Card hover 3D tilt effect
export function useCardTilt() {
  const cardRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (prefersReducedMotion || !cardRef.current) return;

      const card = cardRef.current;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;

      gsap.to(card, {
        rotateX,
        rotateY,
        transformPerspective: 1000,
        duration: 0.3,
        ease: 'power2.out',
      });
    },
    [prefersReducedMotion]
  );

  const handleMouseLeave = useCallback(() => {
    if (prefersReducedMotion || !cardRef.current) return;

    gsap.to(cardRef.current, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.5,
      ease: 'power2.out',
    });
  }, [prefersReducedMotion]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || prefersReducedMotion) return;

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave, prefersReducedMotion]);

  return cardRef;
}

// Floating animation for decorative elements
export function useFloating(options: { duration?: number; y?: number } = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const { duration = 3, y = 10 } = options;

  useEffect(() => {
    if (prefersReducedMotion || !ref.current) return;

    const tween = gsap.to(ref.current, {
      y: y,
      duration,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    return () => {
      tween.kill();
    };
  }, [prefersReducedMotion, duration, y]);

  return ref;
}

// Counter animation for numbers
export function useCountUp(
  end: number,
  options: { duration?: number; start?: number } = {}
) {
  const ref = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const { duration = 2, start = 0 } = options;

  useEffect(() => {
    if (!ref.current) return;

    if (prefersReducedMotion) {
      ref.current.textContent = end.toString();
      return;
    }

    const trigger = ScrollTrigger.create({
      trigger: ref.current,
      start: 'top 80%',
      onEnter: () => {
        gsap.fromTo(
          ref.current,
          { textContent: start },
          {
            textContent: end,
            duration,
            ease: 'power2.out',
            snap: { textContent: 1 },
          }
        );
      },
      once: true,
    });

    return () => trigger.kill();
  }, [end, start, duration, prefersReducedMotion]);

  return ref;
}
