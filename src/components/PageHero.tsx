import Link from 'next/link';
import { img, PHOTOS, srcSet } from '@/lib/img';
import { Embers } from './Embers';

export function PageHero({ title, intro, crumbs = [], image = PHOTOS.logs }: { title: string; intro?: string; crumbs?: { href: string; label: string }[]; image?: string | null }) {
  return (
    <section className={`page-hero${image ? ' has-img' : ''}`}>
      {image && (
        <div className="page-hero-img" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img(image, 1600, 600, 65)} srcSet={srcSet(image, [700, 1200, 1800], 1600 / 600)} sizes="100vw" alt="" fetchPriority="high" />
        </div>
      )}
      {image && <Embers count={12} />}
      <div className="container">
        <nav className="breadcrumb" aria-label="Fil d'Ariane">
          <Link href="/">Accueil</Link>
          {crumbs.map((c) => <span key={c.href}> / <Link href={c.href}>{c.label}</Link></span>)}
          <span> / {title}</span>
        </nav>
        <h1>{title}</h1>
        {intro ? <p>{intro}</p> : null}
      </div>
    </section>
  );
}
