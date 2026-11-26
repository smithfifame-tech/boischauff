import { PHOTOS } from '@/lib/img';
import type { Metadata } from 'next';
import { PageHero } from '@/components/PageHero';
import { ProductCard } from '@/components/ProductCard';
import { getProducts } from '@/lib/catalog';
import { getSettings } from '@/lib/settings';

export const metadata: Metadata = { title: 'Boutique — bois de chauffage', description: 'Bois mixte, bois dur, chêne, bois sec, premium et bois d\'allumage : choisissez votre bois et la quantité exacte.', alternates: { canonical: '/boutique' } };

export default async function ShopPage() {
  const [products, s] = await Promise.all([getProducts(), getSettings()]);
  return (
    <>
      <PageHero image={PHOTOS.bigPile} title="Boutique" intro="Toutes nos essences, séchées et prêtes à brûler. Prix calculé au kilo avec tarifs dégressifs automatiques." />
      <section className="section">
        <div className="container">
          {products.length === 0
            ? <p className="empty-state">Aucun produit n&apos;est disponible pour le moment.</p>
            : <div className="products-grid">{products.map((p, n) => <div key={p.id} data-reveal="up" style={{ display: 'grid', ['--d' as string]: `${(n % 3) * 0.1}s` }}><ProductCard p={p} currency={s.commerce.currency} locale={s.commerce.locale} showDemo={s.commerce.show_demo_notice} /></div>)}</div>}
        </div>
      </section>
    </>
  );
}
