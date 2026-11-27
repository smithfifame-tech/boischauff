import Link from 'next/link';
import type { Product } from '@/lib/catalog';
import { formatMoney } from '@/lib/pricing';
import { img, srcSet } from '@/lib/img';
import { AddToCart } from './AddToCart';
import { Stars } from './Stars';
import { Flame, Sparkles, Leaf, Crown } from 'lucide-react';

export function ProductCard({ p, currency, locale, showDemo, rating }: { p: Product; currency: string; locale: string; showDemo: boolean; rating?: { average: number; count: number } }) {
  const image = p.images[0];
  const refQty = Math.max(p.min_qty_kg, 50);
  const tierPrices = p.rules.filter((r) => r.rule_type === 'tier' && r.price_per_kg).map((r) => r.price_per_kg as number);
  const fromPrice = Math.min(p.base_price_per_kg, ...tierPrices);
  const BadgeIcon = /meilleur|best/i.test(p.badge || '') ? Flame : /premium/i.test(p.badge || '') ? Crown : /éco|eco|naturel/i.test(p.badge || '') ? Leaf : Sparkles;
  return (
    <article className="product-card">
      <Link href={`/produits/${p.slug}`} className="product-media" aria-label={`Voir ${p.name}`}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img(image.url, 640, 400)} srcSet={srcSet(image.url, [400, 640, 900], 1.6)} sizes="(max-width: 720px) 100vw, (max-width: 1180px) 33vw, 22vw"
            alt={image.alt || p.name} loading="lazy" decoding="async" width={640} height={400} />
        ) : null}
        {p.badge && <span className={`product-badge${/meilleur/i.test(p.badge) ? ' hot' : ''}`}><BadgeIcon size={13} aria-hidden /> {p.badge}</span>}
      </Link>
      <div className="product-body">
        <h3><Link href={`/produits/${p.slug}`}>{p.name}</Link></h3>
        <div className="product-sub">{p.short_description}</div>
        {rating && rating.count > 0 ? <div><Stars value={rating.average} size={15} count={rating.count} /></div> : null}
        <div className="product-price">
          À partir de <b>{formatMoney(fromPrice, currency, locale)}/kg</b>
          {showDemo && p.is_demo_price ? <div><span className="demo-tag">Prix démo</span></div> : null}
        </div>
        <AddToCart productId={p.id} compact defaultQty={refQty} />
      </div>
    </article>
  );
}
