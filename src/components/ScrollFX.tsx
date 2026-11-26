'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowUp } from 'lucide-react';

/** Animations globales : apparition au défilement, compteurs, barre de progression, retour en haut. */
export function ScrollFX() {
  const path = usePathname();
  const bar = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animateCount = (el: HTMLElement) => {
      const target = Number(el.dataset.count || 0);
      const dec = Number(el.dataset.decimals || 0);
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      const fmt = (v: number) => `${prefix}${v.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec })}${suffix}`;
      if (reduce) { el.textContent = fmt(target); return; }
      const t0 = performance.now(); const dur = 1600;
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt(target * e);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        const el = en.target as HTMLElement;
        el.classList.add('is-in');
        if (el.dataset.count !== undefined) animateCount(el);
        io.unobserve(el);
      }
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    const scan = () => document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in), [data-count]:not(.is-in), .section-title:not(.is-in), .step:not(.is-in)').forEach((el) => io.observe(el));
    scan();
    const mo = new MutationObserver(() => scan());
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, [path]);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        const p = h > 0 ? window.scrollY / h : 0;
        bar.current?.style.setProperty('--p', String(p));
        setTop(window.scrollY > 700);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <>
      <div ref={bar} className="scroll-progress" aria-hidden />
      <button type="button" className={`to-top${top ? ' show' : ''}`} aria-label="Revenir en haut de la page"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><ArrowUp size={22} /></button>
    </>
  );
}
