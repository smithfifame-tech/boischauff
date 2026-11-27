import { PHOTOS } from '@/lib/img';
import type { Metadata } from 'next';
import { PageHero } from '@/components/PageHero';
import { CheckoutForm } from '@/components/CheckoutForm';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const metadata: Metadata = { title: 'Commande', robots: { index: false } };

export default async function CheckoutPage() {
  const user = await getCurrentUser().catch(() => null);
  let address: { line1: string; line2: string; city: string; postal_code: string; country: string } | null = null;
  if (user) {
    const rows = await db()<{ line1: string; line2: string; city: string; postal_code: string; country: string }[]>`
      select line1, line2, city, postal_code, country from addresses where user_id = ${user.id} and order_id is null order by is_default desc, id desc limit 1`;
    address = rows[0] ?? null;
  }
  return (
    <>
      <PageHero image={PHOTOS.shed} title="Finaliser ma commande" intro="Vos informations de livraison, puis un devis détaillé vérifié par notre serveur avant le paiement." crumbs={[{ href: '/panier', label: 'Panier' }]} />
      <section className="section">
        <div className="container">
          <CheckoutForm key={user?.id ?? 'invite'} user={user ? { firstName: user.first_name, lastName: user.last_name, email: user.email, phone: user.phone } : null}
            address={address ? { line1: address.line1, line2: address.line2, city: address.city, postalCode: address.postal_code, country: address.country } : null} />
        </div>
      </section>
    </>
  );
}
