import type { Metadata } from 'next';
import { PageHero } from '@/components/PageHero';
import { CartView } from '@/components/CartView';

export const metadata: Metadata = { title: 'Panier', robots: { index: false } };

export default function CartPage() {
  return (
    <>
      <PageHero title="Mon panier" intro="Modifiez vos quantités et unités : les montants sont recalculés instantanément." />
      <section className="section"><div className="container"><CartView /></div></section>
    </>
  );
}
