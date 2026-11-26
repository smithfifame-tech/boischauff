import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/PageHero';
import { DemoPayment } from '@/components/DemoPayment';
import { db } from '@/lib/db';
import { safeEqual } from '@/lib/security';
import { activeProvider } from '@/lib/payments';
import { getSettings } from '@/lib/settings';
import { formatMoney } from '@/lib/pricing';

export const metadata: Metadata = { title: 'Paiement — mode démonstration', robots: { index: false } };
type Props = { params: Promise<{ tx: string }>; searchParams: Promise<{ t?: string }> };

export default async function DemoPaymentPage({ params, searchParams }: Props) {
  const { tx } = await params;
  const { t } = await searchParams;
  if (activeProvider() !== 'demo') notFound();
  const [row] = await db()<{ public_id: string; amount: string; currency: string; status: string; provider: string; order_number: string; access_token: string }[]>`
    select t.public_id, t.amount, t.currency, t.status, t.provider, o.order_number, o.access_token
    from payment_transactions t join orders o on o.id = t.order_id where t.public_id = ${tx}`;
  if (!row || row.provider !== 'demo' || !t || !safeEqual(row.access_token, t)) notFound();
  const s = await getSettings();
  return (
    <>
      <PageHero title="Passerelle de paiement — DÉMONSTRATION" intro="SaaSPay n'est pas encore configuré : cette page simule la passerelle. Aucun paiement réel n'est effectué." />
      <section className="section"><div className="container" style={{ maxWidth: 620 }}>
        <DemoPayment txId={row.public_id} token={t} orderNumber={row.order_number} status={row.status}
          amount={formatMoney(Number(row.amount), row.currency, s.commerce.locale)} />
      </div></section>
    </>
  );
}
