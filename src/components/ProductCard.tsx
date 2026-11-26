import Link from 'next/link';
import type { Product } from '@/lib/catalog';
import { formatMoney, formatQty } from '@/lib/pricing';
import { img, srcSet } from '@/lib/img';
import { AddToCart } from './AddToCart';

export function ProductCard({ p, currency, locale, showDemo }: { p: Product; currency: string; locale: string; showDemo: boolean }) {
  const image = p.images[0];
  const refQty = Math.max(p.min_qty_kg, 50);
  return (
    <article className="product-card">
      <Link href={`/produits/${p.slug}`} className="product-media" aria-label={`Voir ${p.name}`}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img(image.url, 640, 400)} srcSet={srcSet(image.url, [400, 640, 900], 1.6)} sizes="(max-width: 720px) 100vw, (max-width: 1180px) 33vw, 22vw"
            alt={image.alt || p.name} loading="lazy" decoding="async" width={640} height={400} />
        ) : null}
        {p.badge && <span className="product-badge">{p.badge}</span>}
      </Link>
      <div className="product-body">
        <h3><Link href={`/produits/${p.slug}`}>{p.name}</Link></h3>
        <div className="product-sub">{p.short_description}</div>
        <div className="product-price">
          {formatMoney(p.base_price_per_kg * refQty, currency, locale)} <small>/ {formatQty(refQty)}</small>
          {showDemo && p.is_demo_price && <div><span className="demo-tag">Prix démo</span></div>}
        </div>
        <AddToCart productId={p.id} compact defaultQty={refQty} />
      </div>
    </article>
  );
}
