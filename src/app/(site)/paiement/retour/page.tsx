import type { Metadata } from 'next';
import { PageHero } from '@/components/PageHero';
import { PaymentReturn } from '@/components/PaymentReturn';

export const metadata: Metadata = { title: 'Vérification du paiement', robots: { index: false } };
type Props = { searchParams: Promise<{ order?: string; t?: string }> };

export default async function ReturnPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <>
      <PageHero title="Vérification du paiement" intro="Nous confirmons votre paiement directement auprès de la passerelle." />
      <section className="section"><div className="container" style={{ maxWidth: 640 }}>
        {sp.order && sp.t ? <PaymentReturn orderNumber={sp.order} token={sp.t} /> : <p className="alert alert-error">Lien invalide.</p>}
      </div></section>
    </>
  );
}
