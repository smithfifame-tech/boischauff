import { PHOTOS } from '@/lib/img';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Clock, Info, ShieldCheck } from 'lucide-react';
import { PageHero } from '@/components/PageHero';
import { OrderDoc } from '@/components/OrderDoc';
import { PayButton } from '@/components/PayButton';
import { PrintButton } from '@/components/PrintButton';
import { loadOrderForPage } from '@/lib/order-access';
import { getSettings } from '@/lib/settings';
import { activeProvider } from '@/lib/payments';
import { formatMoney } from '@/lib/pricing';

export const metadata: Metadata = { title: 'Paiement sécurisé', robots: { index: false } };
type Props = { searchParams: Promise<{ order?: string; t?: string; cancelled?: string }> };

export default async function PaymentPage({ searchParams }: Props) {
  const sp = await searchParams;
  const [o, s] = await Promise.all([loadOrderForPage(sp.order, sp.t), getSettings()]);
  if (!o) {
    return (<><PageHero image={PHOTOS.stove} title="Paiement" /><section className="section"><div className="container"><p className="alert alert-error"><span>Commande introuvable ou lien invalide. Utilisez le lien reçu par e-mail ou le <Link href="/suivi" style={{ textDecoration: 'underline' }}>suivi de commande</Link>.</span></p></div></section></>);
  }
  const q = `order=${encodeURIComponent(o.order_number)}&t=${encodeURIComponent(o.access_token)}`;
  if (o.payment_status === 'paid') redirect(`/commande/confirmation?${q}`);
  const provider = activeProvider();
  const lastFailed = o.transactions[0]?.status === 'failed';

  return (
    <>
      <PageHero image={PHOTOS.stove} title="Devis & paiement sécurisé" intro={`Commande ${o.order_number} — vérifiez votre devis puis réglez en ligne.`} />
      <section className="section">
        <div className="container two-col">
          <div>
            <OrderDoc o={o} s={s} kind="quote" />
            <div style={{ marginTop: 14 }}><PrintButton /></div>
          </div>
          <div className="sticky no-print">
            <div className="card card-pad pay-box">
              {o.status === 'awaiting_quote' ? (
                <>
                  <Clock size={40} color="var(--orange)" aria-hidden style={{ margin: '0 auto 8px' }} />
                  <h2 style={{ fontSize: '1.25rem' }}>Frais de livraison en cours de calcul</h2>
                  <p className="hint">Votre zone nécessite une validation manuelle. Notre équipe vous envoie le montant définitif par e-mail ; le paiement sera alors disponible ici même.</p>
                  <p className="alert alert-info" style={{ textAlign: 'left' }}><Info size={18} aria-hidden /> Aucun paiement n&apos;est demandé tant que le total n&apos;est pas confirmé.</p>
                  <Link href={`/suivi?order=${encodeURIComponent(o.order_number)}`} className="btn btn-green btn-block">Suivre ma commande</Link>
                </>
              ) : o.status === 'cancelled' ? (
                <p className="alert alert-error">Cette commande a été annulée.</p>
              ) : (
                <>
                  <ShieldCheck size={40} color="var(--green)" aria-hidden style={{ margin: '0 auto 8px' }} />
                  <h2 style={{ fontSize: '1.25rem' }}>Montant à régler</h2>
                  <p style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--green)', fontFamily: 'var(--font-title)', margin: '0 0 12px' }}>{formatMoney(o.total_amount ?? 0, o.currency, s.commerce.locale)}</p>
                  {sp.cancelled && <p className="alert alert-warn" style={{ textAlign: 'left' }}>Paiement interrompu. Vous pouvez réessayer quand vous le souhaitez.</p>}
                  {lastFailed && !sp.cancelled && <p className="alert alert-error" style={{ textAlign: 'left' }}>Le dernier paiement a été refusé{o.transactions[0].failure_reason ? ` (${o.transactions[0].failure_reason})` : ''}. Vous pouvez réessayer.</p>}
                  {provider === 'demo' && <p className="alert alert-warn" style={{ textAlign: 'left' }}><Info size={18} aria-hidden /> <span><strong>Mode démonstration</strong> : le paiement par carte (Stripe) n&apos;est pas encore activé. Le paiement sera simulé, sans aucun encaissement.</span></p>}
                  {provider === 'none'
                    ? <p className="alert alert-error" style={{ textAlign: 'left' }}>Le paiement en ligne n&apos;est pas encore disponible. Contactez-nous{s.company.phone ? ` au ${s.company.phone}` : ''} pour finaliser votre commande.</p>
                    : <PayButton orderNumber={o.order_number} token={o.access_token} label={lastFailed || sp.cancelled ? 'Réessayer le paiement' : `Payer ${formatMoney(o.total_amount ?? 0, o.currency, s.commerce.locale)}`} />}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
