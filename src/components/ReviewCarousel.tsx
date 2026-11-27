'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, MessageSquareQuote } from 'lucide-react';
import { Stars } from './Stars';

export interface CarouselReview { id: number; author: string; city: string; rating: number; comment: string }

export function ReviewCarousel({ reviews }: { reviews: CarouselReview[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (reviews.length < 2 || paused) return;
    const t = setInterval(() => setI((x) => (x + 1) % reviews.length), 6000);
    return () => clearInterval(t);
  }, [reviews.length, paused]);

  if (!reviews.length) {
    return (
      <aside className="review-card" data-reveal="right">
        <span className="q" aria-hidden>“</span>
        <blockquote style={{ fontSize: '1.02rem' }}>Vos avis comptent ! Après votre livraison, notez votre bois et notre service : chaque avis publié provient d&apos;une commande réellement payée.</blockquote>
        <div className="who"><span className="avatar"><MessageSquareQuote size={22} aria-hidden /></span><div><strong>Avis vérifiés</strong><small>Publiés après modération</small></div></div>
        <Link href="/avis" className="btn btn-outline-gold btn-sm" style={{ marginTop: 14, alignSelf: 'flex-start' }}>Voir les avis <ArrowRight size={16} aria-hidden /></Link>
      </aside>
    );
  }
  const r = reviews[i];
  return (
    <aside className="review-card" data-reveal="right" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carrousel" aria-label="Avis clients">
      <span className="q" aria-hidden>“</span>
      <div key={r.id} className="review-slide" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <blockquote>{r.comment.length > 220 ? `${r.comment.slice(0, 217)}…` : r.comment}</blockquote>
        <div className="who">
          <span className="avatar" aria-hidden>{r.author.charAt(0)}</span>
          <div><strong>{r.author}</strong><small><BadgeCheck size={13} aria-hidden style={{ verticalAlign: '-2px', color: '#7BD88F' }} /> Client vérifié{r.city ? ` · ${r.city}` : ''}</small><Stars value={r.rating} size={15} /></div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="dots">{reviews.map((x, k) => <button key={x.id} type="button" className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={`Avis ${k + 1}`} />)}</div>
        <button type="button" onClick={() => setI((x) => (x + 1) % reviews.length)} aria-label="Avis suivant" style={{ background: 'none', border: 0, color: 'var(--orange)', cursor: 'pointer' }}><ArrowRight size={22} /></button>
      </div>
    </aside>
  );
}
