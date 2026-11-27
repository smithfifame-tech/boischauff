import type { Metadata } from 'next';
import Link from 'next/link';
import { BadgeCheck, MessageSquareQuote } from 'lucide-react';
import { PageHero } from '@/components/PageHero';
import { Stars } from '@/components/Stars';
import { getApprovedReviews, getReviewStats } from '@/lib/reviews';
import { PHOTOS } from '@/lib/img';

export const metadata: Metadata = { title: 'Avis clients', description: 'Avis vérifiés de clients ayant commandé et payé leur bois de chauffage.' };

export default async function ReviewsPage() {
  const [reviews, stats] = await Promise.all([getApprovedReviews(60), getReviewStats()]);
  return (
    <>
      <PageHero image={PHOTOS.livingFire} title="Avis clients" intro="Uniquement des avis vérifiés : chaque avis provient d'une commande réellement payée." />
      <section className="section">
        <div className="container">
          <div className="card card-pad reviews-summary" data-reveal="up">
            <div style={{ textAlign: 'center' }}>
              <div className="big">{stats.count ? stats.average.toLocaleString('fr-FR', { minimumFractionDigits: 1 }) : '–'}</div>
              <Stars value={stats.average} size={22} />
              <p className="hint" style={{ margin: '6px 0 0' }}>{stats.count ? `${stats.count} avis vérifié${stats.count > 1 ? 's' : ''}` : 'Aucun avis publié pour le moment'}</p>
            </div>
            <div className="dist" data-reveal="up">
              {[5, 4, 3, 2, 1].map((n) => {
                const c = stats.distribution[n - 1];
                return <div key={n}><span>{n} ★</span><span className="bar"><i style={{ ['--w' as string]: `${stats.count ? (c / stats.count) * 100 : 0}%` }} /></span><span>{c}</span></div>;
              })}
            </div>
          </div>

          {reviews.length ? (
            <div className="review-list" style={{ marginTop: 24 }}>
              {reviews.map((r, i) => (
                <article className="card card-pad review-item" key={r.id} data-reveal="up" style={{ ['--d' as string]: `${(i % 2) * 0.1}s` }}>
                  <header>
                    <span className="avatar" aria-hidden>{r.author.charAt(0)}</span>
                    <div><strong>{r.author}</strong><small><BadgeCheck size={13} aria-hidden style={{ verticalAlign: '-2px', color: '#2E8B47' }} /> Achat vérifié{r.city ? ` · ${r.city}` : ''} · {new Date(r.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</small></div>
                    <span style={{ marginLeft: 'auto' }}><Stars value={r.rating} /></span>
                  </header>
                  <p>{r.comment}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="card card-pad empty-state" style={{ marginTop: 24 }} data-reveal="zoom">
              <MessageSquareQuote size={48} aria-hidden />
              <h2>Soyez le premier à donner votre avis</h2>
              <p className="hint">Après votre commande, laissez une note depuis votre espace client.</p>
              <Link href="/boutique" className="btn btn-primary">Découvrir nos bois</Link>
            </div>
          )}
          <p className="hint" style={{ textAlign: 'center', marginTop: 24 }}>Vous avez commandé chez nous ? <Link href="/compte#avis" style={{ color: 'var(--orange)', fontWeight: 800 }}>Laisser un avis</Link></p>
        </div>
      </section>
    </>
  );
}
