import Link from 'next/link';

export function PageHero({ title, intro, crumbs = [] }: { title: string; intro?: string; crumbs?: { href: string; label: string }[] }) {
  return (
    <section className="page-hero">
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
