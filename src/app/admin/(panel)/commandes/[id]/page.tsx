import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Download } from 'lucide-react';
import { OrderDoc } from '@/components/OrderDoc';
import { PrintButton } from '@/components/PrintButton';
import { OrderActions } from '@/components/admin/OrderActions';
import { getFullOrder, ORDER_STATUSES, PAYMENT_STATUSES } from '@/lib/orders';
import { getSettings } from '@/lib/settings';
import { db } from '@/lib/db';
import { formatMoney } from '@/lib/pricing';
import { payBadge, statusBadge } from '@/lib/admin-ui';

type Props = { params: Promise<{ id: string }> };
const fmt = (d: Date | string | null) => (d ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Paris' }) : '—');

export default async function AdminOrder({ params }: Props) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [o, s] = await Promise.all([getFullOrder({ id }), getSettings()]);
  if (!o) notFound();
  const emails = await db()<{ id: number; template: string; recipient: string; status: string; error: string; attempts: number; updated_at: Date }[]>`
    select id, template, recipient, status, error, attempts, updated_at from email_logs where order_id = ${id} order by updated_at desc`;
  const m = (v: number) => formatMoney(v, o.currency, s.commerce.locale);
  return (
    <>
      <div className="admin-head no-print">
        <div>
          <Link href="/admin/commandes" className="hint" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><ArrowLeft size={16} /> Commandes</Link>
          <h1>{o.order_number} {o.is_demo && <span className="demo-tag">démo</span>}</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <span className={`badge ${statusBadge(o.status)}`}>{ORDER_STATUSES[o.status]}</span>
            <span className={`badge ${payBadge(o.payment_status)}`}>{PAYMENT_STATUSES[o.payment_status]}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <PrintButton label="Imprimer la commande" />
          {o.payment_status === 'paid' && <a className="btn btn-ghost" href={`/api/receipts/${encodeURIComponent(o.order_number)}`}><Download size={18} /> Reçu PDF</a>}
        </div>
      </div>
      <div className="admin-grid">
        <div>
          <OrderDoc o={o} s={s} kind="order" />
          <div className="panel no-print" style={{ marginTop: 18 }}>
            <h2>Paiement</h2>
            {o.payment ? (
              <dl className="kv">
                <dt>Passerelle</dt><dd>{o.payment.provider === 'demo' ? 'Démonstration (aucun encaissement)' : o.payment.provider === 'stripe' ? 'Stripe (carte bancaire)' : 'SasPay'}</dd>
                <dt>Montant</dt><dd>{m(o.payment.amount)}</dd>
                <dt>Référence</dt><dd style={{ wordBreak: 'break-all' }}>{o.payment.transaction_ref}</dd>
                <dt>Moyen</dt><dd>{o.payment.method || '—'}</dd>
                <dt>Payé le</dt><dd>{fmt(o.payment.paid_at)}</dd>
                {o.receipt && <><dt>Reçu</dt><dd>{o.receipt.receipt_number}</dd></>}
              </dl>
            ) : <p className="hint">Aucun paiement confirmé.</p>}
            {o.transactions.length > 0 && (
              <div className="table-wrap" style={{ marginTop: 12 }}>
                <table className="table" style={{ minWidth: 560 }}>
                  <thead><tr><th>Transaction</th><th>Statut</th><th>Montant</th><th>Date</th><th>Motif</th></tr></thead>
                  <tbody>{o.transactions.map((t) => (
                    <tr key={t.public_id}><td>{t.public_id}<br /><span className="hint">{t.provider} {t.provider_tx_id ?? ''}</span></td>
                      <td><span className={`badge ${t.status === 'succeeded' ? 'b-green' : t.status === 'failed' ? 'b-red' : 'b-orange'}`}>{t.status}</span></td>
                      <td>{m(t.amount)}</td><td>{fmt(t.updated_at)}</td><td className="hint">{t.failure_reason}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <div className="no-print">
          <OrderActions id={o.id} status={o.status} paymentStatus={o.payment_status} deliveryFee={o.delivery_fee} internalNote={o.internal_note} currency={o.currency} />
          <div className="panel">
            <h2>Historique & suivi</h2>
            <ul className="history">
              {o.tracking.slice().reverse().map((t) => (
                <li key={t.id}><div><strong style={{ display: 'block' }}>{t.note || t.status}</strong>
                  <time>{fmt(t.created_at)} · {t.created_by}{!t.is_public ? ' · interne' : ''}</time></div></li>
              ))}
            </ul>
          </div>
          <div className="panel">
            <h2>E-mails</h2>
            {emails.length === 0 ? <p className="hint">Aucun e-mail.</p> : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8, fontSize: '.88rem' }}>
                {emails.map((e) => (
                  <li key={e.id}><span className={`badge ${e.status === 'sent' ? 'b-green' : e.status === 'failed' ? 'b-red' : 'b-grey'}`}>{e.status}</span> {e.template} → {e.recipient}
                    <br /><span className="hint">{fmt(e.updated_at)} · {e.attempts} tentative(s){e.error ? ` · ${e.error}` : ''}</span></li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
