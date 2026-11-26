import { PHOTOS } from '@/lib/img';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, Clock, Download, PackageSearch } from 'lucide-react';
import { PageHero } from '@/components/PageHero';
import { OrderDoc } from '@/components/OrderDoc';
import { loadOrderForPage } from '@/lib/order-access';
import { getSettings } from '@/lib/settings';
import { ORDER_STATUSES, PAYMENT_STATUSES } from '@/lib/orders';
import { formatMoney } from '@/lib/pricing';

export const metadata: Metadata = { title: 'Confirmation de commande', robots: { index: false } };
type Props = { searchParams: Promise<{ order?: string; t?: string }> };

export default async function ConfirmationPage({ searchParams }: Props) {
  const sp = await searchParams;
  const [o, s] = await Promise.all([loadOrderForPage(sp.order, sp.t), getSettings()]);
  if (!o) {
    return (<><PageHero image={PHOTOS.livingFire} title="Confirmation" /><section className="section"><div className="container"><p className="alert alert-error">Commande introuvable ou lien invalide.</p></div></section></>);
  }
  const paid = o.payment_status === 'paid';
  const q = `order=${encodeURIComponent(o.order_number)}&t=${encodeURIComponent(o.access_token)}`;
  const m = (v: number | null) => formatMoney(v ?? 0, o.currency, s.commerce.locale);
  return (
    <>
      <PageHero image={PHOTOS.livingFire} title={paid ? 'Merci pour votre commande !' : 'Commande enregistrée'} intro={paid ? 'Votre paiement est confirmé. Un e-mail récapitulatif avec votre reçu vous a été envoyé.' : 'Votre commande attend encore la confirmation du paiement.'} />
      <section className="section">
        <div className="container two-col">
          <div><OrderDoc o={o} s={s} kind="order" /></div>
          <div className="sticky">
            <div className="card card-pad" style={{ textAlign: 'center' }}>
              {paid ? <CheckCircle2 size={54} color="var(--success)" aria-hidden style={{ margin: '0 auto 8px' }} /> : <Clock size={54} color="var(--orange)" aria-hidden style={{ margin: '0 auto 8px' }} />}
              <h2 style={{ fontSize: '1.3rem' }}>{paid ? 'Paiement confirmé' : PAYMENT_STATUSES[o.payment_status]}</h2>
              <dl className="kv" style={{ textAlign: 'left', margin: '14px 0' }}>
                <dt>N° de commande</dt><dd>{o.order_number}</dd>
                <dt>Statut paiement</dt><dd><span className={`badge ${paid ? 'b-green' : 'b-orange'}`}>{PAYMENT_STATUSES[o.payment_status]}</span></dd>
                <dt>Statut commande</dt><dd>{ORDER_STATUSES[o.status]}</dd>
                <dt>Date de commande</dt><dd>{new Date(o.created_at).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Paris' })}</dd>
                <dt>Frais de livraison</dt><dd>{o.delivery_fee === null ? 'Sur devis' : o.delivery_fee === 0 ? 'Offerts' : m(o.delivery_fee)}</dd>
                <dt>{paid ? 'Montant payé' : 'Montant'}</dt><dd style={{ color: 'var(--green)', fontSize: '1.2rem' }}>{o.total_amount === null ? 'Sur devis' : m(o.total_amount)}</dd>
                {o.payment?.transaction_ref && <><dt>Réf. transaction</dt><dd style={{ wordBreak: 'break-all' }}>{o.payment.transaction_ref}</dd></>}
              </dl>
              {paid && o.payment?.is_demo && <p className="alert alert-warn" style={{ textAlign: 'left' }}>Paiement de démonstration : aucun montant n&apos;a été encaissé.</p>}
              <div style={{ display: 'grid', gap: 10 }}>
                {paid && <a href={`/api/receipts/${encodeURIComponent(o.order_number)}?t=${encodeURIComponent(o.access_token)}`} className="btn btn-primary btn-block"><Download size={18} aria-hidden /> Télécharger le reçu</a>}
                {!paid && o.status === 'pending_payment' && <Link href={`/commande/paiement?${q}`} className="btn btn-primary btn-block">Payer ma commande</Link>}
                <Link href={`/suivi?order=${encodeURIComponent(o.order_number)}`} className="btn btn-green btn-block"><PackageSearch size={18} aria-hidden /> Suivre ma commande</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
