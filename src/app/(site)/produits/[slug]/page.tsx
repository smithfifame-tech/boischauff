import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, Droplets, Flame, Package, Timer, TreePine } from 'lucide-react';
import { PageHero } from '@/components/PageHero';
import { AddToCart } from '@/components/AddToCart';
import { Gallery } from '@/components/Gallery';
import { getProductBySlug } from '@/lib/catalog';
import { getSettings } from '@/lib/settings';
import { formatMoney, formatQty, quoteLine } from '@/lib/pricing';
import { img } from '@/lib/img';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  if (!p) return { title: 'Produit introuvable' };
  return {
    title: p.name, description: `${p.name} — ${p.short_description}. ${p.description.slice(0, 140)}`,
    alternates: { canonical: `/produits/${p.slug}` },
    openGraph: { title: p.name, description: p.short_description, images: p.images[0] ? [{ url: img(p.images[0].url, 1200, 630) }] : [] },
  };
}

export default async function ProductPage({ params }: Props) {
  const [p, s] = await Promise.all([getProductBySlug((await params).slug), getSettings()]);
  if (!p) notFound();
  const m = (v: number) => formatMoney(v, s.commerce.currency, s.commerce.locale);
  const examples = [50, 100, 500, 1000].filter((k) => k >= p.min_qty_kg && (p.max_qty_kg === null || k <= p.max_qty_kg));
  const tiers = p.rules.filter((r) => r.rule_type === 'tier').sort((a, b) => (a.min_qty_kg ?? 0) - (b.min_qty_kg ?? 0));
  const packs = p.rules.filter((r) => r.rule_type === 'pack');
  const productLd = {
    '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.description, image: p.images.map((i) => img(i.url, 1200)),
    offers: { '@type': 'Offer', priceCurrency: s.commerce.currency, price: p.base_price_per_kg.toFixed(2), unitText: 'kg',
      availability: p.stock_kg === 0 ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock' },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <PageHero title={p.name} intro={p.short_description} crumbs={[{ href: '/boutique', label: 'Boutique' }]} />
      <section className="section">
        <div className="container product-detail">
          <div>
            <Gallery images={p.images} name={p.name} />
            <div className="card card-pad" style={{ marginTop: 22 }}>
              <h2 style={{ fontSize: '1.2rem' }}>Description</h2>
              <p style={{ color: '#3a443d' }}>{p.description}</p>
              {p.features.length > 0 && (
                <ul className="feature-list">{p.features.map((f) => <li key={f}><CheckCircle2 size={18} aria-hidden /> {f}</li>)}</ul>
              )}
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {p.badge && <span className="badge b-orange">{p.badge}</span>}
              {p.is_demo_price && s.commerce.show_demo_notice && <span className="demo-tag">Prix de démonstration</span>}
              <span className={`badge ${p.stock_kg === 0 ? 'b-red' : 'b-green'}`}>{p.stock_kg === null ? 'Disponible' : p.stock_kg === 0 ? 'Rupture de stock' : `En stock : ${formatQty(p.stock_kg)}`}</span>
            </div>
            <p style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--orange)', margin: '12px 0 4px', fontFamily: 'var(--font-title)' }}>
              {m(p.base_price_per_kg)} <span style={{ fontSize: '1rem', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>/ kg</span>
            </p>
            <p className="hint">Unité de vente : {p.sale_unit} · Commande de {formatQty(p.min_qty_kg)}{p.max_qty_kg ? ` à ${formatQty(p.max_qty_kg)}` : ' minimum'}</p>
            <div className="specs">
              <div className="spec"><TreePine size={18} aria-hidden /><div><small>Essence</small><strong>{p.species || '—'}</strong></div></div>
              <div className="spec"><Timer size={18} aria-hidden /><div><small>Séchage</small><strong>{p.drying_level || '—'}</strong></div></div>
              <div className="spec"><Droplets size={18} aria-hidden /><div><small>Humidité</small><strong>{p.moisture || '—'}</strong></div></div>
              <div className="spec"><Flame size={18} aria-hidden /><div><small>Usage recommandé</small><strong>{p.recommended_use || '—'}</strong></div></div>
            </div>
            <div className="buy-box">
              <h2 style={{ fontSize: '1.15rem', display: 'flex', gap: 8, alignItems: 'center' }}><Package size={20} aria-hidden /> Choisir ma quantité</h2>
              <AddToCart productId={p.id} defaultQty={Math.max(p.min_qty_kg, 100)} />
            </div>
            <div className="card card-pad" style={{ marginTop: 18 }}>
              <h2 style={{ fontSize: '1.1rem' }}>Grille tarifaire</h2>
              <table className="tier-table">
                <thead><tr><th>Quantité</th><th>Tarif appliqué</th><th>Prix</th></tr></thead>
                <tbody>
                  {examples.map((k) => { const q = quoteLine(p, k, 'kg'); return (
                    <tr key={k}><td>{formatQty(k)}</td><td>{q.ok ? q.label : '—'}</td><td><strong>{q.ok ? m(q.totalCents / 100) : '—'}</strong></td></tr>
                  ); })}
                  {tiers.map((t) => <tr key={`t${t.min_qty_kg}`}><td>Dès {formatQty(t.min_qty_kg ?? 0)}</td><td>{t.label || 'Palier'}</td><td>{m(t.price_per_kg ?? 0)}/kg</td></tr>)}
                  {packs.map((t) => <tr key={`p${t.pack_qty_kg}`}><td>{formatQty(t.pack_qty_kg ?? 0)}</td><td>{t.label || 'Forfait'}</td><td>{m(t.pack_price ?? 0)}</td></tr>)}
                </tbody>
              </table>
              <p className="hint" style={{ marginTop: 10, marginBottom: 0 }}>Besoin d&apos;une quantité personnalisée ? Utilisez le <Link href={`/devis?produit=${p.id}`} style={{ color: 'var(--orange)', fontWeight: 800 }}>calculateur de devis</Link>.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
