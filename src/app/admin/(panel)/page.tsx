import Link from 'next/link';
import { db } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { ORDER_STATUSES, PAYMENT_STATUSES, type OrderStatus } from '@/lib/orders';
import { formatMoney } from '@/lib/pricing';
import { activeProvider } from '@/lib/payments';
import { mailTransportName } from '@/lib/mailer';
import { payBadge, statusBadge } from '@/lib/admin-ui';

export default async function AdminDashboard() {
  const s = await getSettings();
  const [[k], latest, [mail]] = await Promise.all([
    db()<Record<string, string>[]>`
      select count(*)::int as total,
        count(*) filter (where created_at >= date_trunc('day', now() at time zone 'Africa/Porto-Novo') at time zone 'Africa/Porto-Novo')::int as today,
        count(*) filter (where status in ('pending_payment','awaiting_quote'))::int as pending,
        count(*) filter (where payment_status = 'paid')::int as paid,
        count(*) filter (where status = 'shipping')::int as shipping,
        count(*) filter (where status = 'delivered')::int as delivered,
        coalesce(sum(total_amount) filter (where payment_status = 'paid' and not is_demo), 0) as revenue,
        coalesce(sum(total_amount) filter (where payment_status = 'paid' and is_demo), 0) as demo_revenue
      from orders`,
    db()<{ id: number; order_number: string; customer_first_name: string; customer_last_name: string; status: OrderStatus; payment_status: keyof typeof PAYMENT_STATUSES; total_amount: string | null; currency: string; created_at: Date; is_demo: boolean }[]>`
      select id, order_number, customer_first_name, customer_last_name, status, payment_status, total_amount, currency, created_at, is_demo
      from orders order by created_at desc limit 10`,
    db()<{ failed: number }[]>`select count(*)::int as failed from email_logs where status in ('failed','skipped') and created_at > now() - interval '7 days'`,
  ]);
  const m = (v: number) => formatMoney(v, s.commerce.currency, s.commerce.locale);
  const provider = activeProvider();
  const transport = mailTransportName();
  const kpis = [
    ['Commandes totales', k.total], ['Commandes du jour', k.today], ['En attente', k.pending], ['Payées', k.paid],
    ['En livraison', k.shipping], ['Livrées', k.delivered], ['Chiffre d\'affaires', m(Number(k.revenue))], ['CA démo (non réel)', m(Number(k.demo_revenue))],
  ];
  return (
    <>
      <div className="admin-head"><h1>Tableau de bord</h1><Link href="/admin/commandes" className="btn btn-green btn-sm">Toutes les commandes</Link></div>
      {provider !== 'saaspay' && <p className="alert alert-warn" style={{ marginBottom: 12 }}>Paiement : {provider === 'demo' ? 'mode DÉMONSTRATION actif (SaaSPay non configuré).' : 'aucune passerelle active.'} Renseignez les variables SAASPAY_* pour encaisser de vrais paiements.</p>}
      {transport === 'none' && <p className="alert alert-warn" style={{ marginBottom: 12 }}>E-mails : aucun service configuré (SMTP ou Resend). Les envois sont journalisés comme « non envoyés » et peuvent être relancés après configuration.</p>}
      {mail.failed > 0 && <p className="alert alert-error" style={{ marginBottom: 12 }}>{mail.failed} e-mail(s) non envoyé(s) ces 7 derniers jours. <Link href="/admin/emails" style={{ textDecoration: 'underline' }}>Voir le journal</Link></p>}
      <div className="kpis">{kpis.map(([l, v]) => <div className="kpi" key={String(l)}><small>{l}</small><b>{v}</b></div>)}</div>
      <div className="panel" style={{ padding: 0 }}>
        <h2 style={{ padding: '18px 20px 0' }}>Dernières commandes</h2>
        <div className="table-wrap" style={{ border: 0 }}>
          <table className="table">
            <thead><tr><th>Commande</th><th>Client</th><th>Date</th><th>Statut</th><th>Paiement</th><th>Total</th></tr></thead>
            <tbody>
              {latest.length === 0 && <tr><td colSpan={6} className="hint">Aucune commande pour le moment.</td></tr>}
              {latest.map((o) => (
                <tr key={o.id}>
                  <td><Link className="row-link" href={`/admin/commandes/${o.id}`}>{o.order_number}</Link>{o.is_demo && <> <span className="demo-tag">démo</span></>}</td>
                  <td>{o.customer_first_name} {o.customer_last_name}</td>
                  <td>{new Date(o.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Africa/Porto-Novo' })}</td>
                  <td><span className={`badge ${statusBadge(o.status)}`}>{ORDER_STATUSES[o.status]}</span></td>
                  <td><span className={`badge ${payBadge(o.payment_status)}`}>{PAYMENT_STATUSES[o.payment_status]}</span></td>
                  <td>{o.total_amount === null ? 'Sur devis' : formatMoney(Number(o.total_amount), o.currency, s.commerce.locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
