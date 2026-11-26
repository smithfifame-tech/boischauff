import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Download, Eye } from 'lucide-react';
import { PageHero } from '@/components/PageHero';
import { AccountProfile } from '@/components/AccountProfile';
import { LogoutButton } from '@/components/LogoutButton';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { ORDER_STATUSES, PAYMENT_STATUSES, type OrderStatus } from '@/lib/orders';
import { formatMoney } from '@/lib/pricing';

export const metadata: Metadata = { title: 'Mon compte', robots: { index: false } };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/compte/connexion');
  const [orders, addr, s] = await Promise.all([
    db()<{ order_number: string; access_token: string; status: OrderStatus; payment_status: keyof typeof PAYMENT_STATUSES; total_amount: string | null; currency: string; created_at: Date }[]>`
      select order_number, access_token, status, payment_status, total_amount, currency, created_at from orders where user_id = ${user.id} order by created_at desc limit 100`,
    db()<{ line1: string; line2: string; city: string; postal_code: string; country: string }[]>`
      select line1, line2, city, postal_code, country from addresses where user_id = ${user.id} and order_id is null order by is_default desc, id desc limit 1`,
    getSettings(),
  ]);
  const badge = (st: string) => (st === 'delivered' || st === 'paid' ? 'b-green' : st === 'cancelled' ? 'b-red' : st === 'shipping' || st === 'preparing' ? 'b-blue' : 'b-orange');
  return (
    <>
      <PageHero title={`Bonjour ${user.first_name || ''}`.trim()} intro="Votre profil, vos adresses, vos commandes et vos reçus." />
      <section className="section">
        <div className="container two-col">
          <div>
            <div className="card">
              <div className="card-pad" style={{ paddingBottom: 8 }}><h2 style={{ fontSize: '1.25rem', margin: 0 }}>Historique des commandes</h2></div>
              {orders.length === 0 ? <p className="card-pad hint">Aucune commande pour le moment. <Link href="/devis" style={{ color: 'var(--orange)', fontWeight: 800 }}>Commander</Link></p> : (
                <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
                  <table className="table">
                    <thead><tr><th>Commande</th><th>Date</th><th>Statut</th><th>Paiement</th><th>Total</th><th></th></tr></thead>
                    <tbody>{orders.map((o) => { const q = `order=${encodeURIComponent(o.order_number)}&t=${encodeURIComponent(o.access_token)}`; return (
                      <tr key={o.order_number}>
                        <td><strong>{o.order_number}</strong></td>
                        <td>{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                        <td><span className={`badge ${badge(o.status)}`}>{ORDER_STATUSES[o.status]}</span></td>
                        <td><span className={`badge ${o.payment_status === 'paid' ? 'b-green' : 'b-orange'}`}>{PAYMENT_STATUSES[o.payment_status]}</span></td>
                        <td>{o.total_amount === null ? 'Sur devis' : formatMoney(Number(o.total_amount), o.currency, s.commerce.locale)}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <Link href={`/commande/confirmation?${q}`} className="btn btn-ghost btn-sm" aria-label="Détails"><Eye size={16} /></Link>{' '}
                          {o.payment_status === 'paid' && <a href={`/api/receipts/${encodeURIComponent(o.order_number)}`} className="btn btn-ghost btn-sm" aria-label="Reçu PDF"><Download size={16} /></a>}
                          {o.status === 'pending_payment' && <Link href={`/commande/paiement?${q}`} className="btn btn-primary btn-sm">Payer</Link>}
                        </td>
                      </tr>); })}</tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          <div>
            <AccountProfile user={{ firstName: user.first_name, lastName: user.last_name, email: user.email, phone: user.phone }}
              address={addr[0] ? { line1: addr[0].line1, line2: addr[0].line2, city: addr[0].city, postalCode: addr[0].postal_code, country: addr[0].country } : null} />
            <div style={{ marginTop: 14 }}><LogoutButton /></div>
          </div>
        </div>
      </section>
    </>
  );
}
