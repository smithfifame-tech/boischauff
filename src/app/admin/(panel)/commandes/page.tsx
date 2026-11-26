import Link from 'next/link';
import { Search } from 'lucide-react';
import { db } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { ORDER_STATUSES, PAYMENT_STATUSES, type OrderStatus } from '@/lib/orders';
import { formatMoney } from '@/lib/pricing';
import { payBadge, statusBadge } from '@/lib/admin-ui';

type Props = { searchParams: Promise<{ q?: string; status?: string; from?: string; to?: string; page?: string }> };
const PER_PAGE = 30;

export default async function AdminOrders({ searchParams }: Props) {
  const sp = await searchParams;
  const s = await getSettings();
  const q = (sp.q || '').trim();
  const status = sp.status && sp.status in ORDER_STATUSES ? sp.status : '';
  const from = /^\d{4}-\d{2}-\d{2}$/.test(sp.from || '') ? sp.from! : '';
  const to = /^\d{4}-\d{2}-\d{2}$/.test(sp.to || '') ? sp.to! : '';
  const page = Math.max(1, Number(sp.page) || 1);
  const sql = db();
  const like = `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
  const where = sql`
    where (${q} = '' or order_number ilike ${like} or customer_email ilike ${like} or customer_phone ilike ${like}
           or (customer_first_name || ' ' || customer_last_name) ilike ${like})
      and (${status} = '' or status = ${status})
      and (${from} = '' or created_at >= ${from || '1970-01-01'}::date)
      and (${to} = '' or created_at < (${to || '1970-01-01'}::date + 1))`;
  const [rows, [{ n }]] = await Promise.all([
    sql<{ id: number; order_number: string; customer_first_name: string; customer_last_name: string; customer_phone: string; delivery_zone_name: string; status: OrderStatus; payment_status: keyof typeof PAYMENT_STATUSES; total_amount: string | null; currency: string; created_at: Date; is_demo: boolean }[]>`
      select id, order_number, customer_first_name, customer_last_name, customer_phone, delivery_zone_name, status, payment_status, total_amount, currency, created_at, is_demo
      from orders ${where} order by created_at desc limit ${PER_PAGE} offset ${(page - 1) * PER_PAGE}`,
    sql<{ n: number }[]>`select count(*)::int as n from orders ${where}`,
  ]);
  const pages = Math.max(1, Math.ceil(n / PER_PAGE));
  const qs = (p: number) => new URLSearchParams({ ...(q && { q }), ...(status && { status }), ...(from && { from }), ...(to && { to }), page: String(p) }).toString();
  return (
    <>
      <div className="admin-head"><h1>Commandes <span className="hint" style={{ fontSize: '1rem' }}>({n})</span></h1></div>
      <form className="filters" method="get">
        <div className="field" style={{ flex: 2, minWidth: 220 }}><label className="label" htmlFor="q">Rechercher</label><input id="q" name="q" className="input" placeholder="N°, client, e-mail, téléphone" defaultValue={q} /></div>
        <div className="field"><label className="label" htmlFor="status">Statut</label>
          <select id="status" name="status" className="select" defaultValue={status}><option value="">Tous</option>{Object.entries(ORDER_STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div className="field"><label className="label" htmlFor="from">Du</label><input id="from" name="from" type="date" className="input" defaultValue={from} /></div>
        <div className="field"><label className="label" htmlFor="to">Au</label><input id="to" name="to" type="date" className="input" defaultValue={to} /></div>
        <button className="btn btn-green btn-sm" style={{ minHeight: 42 }}><Search size={16} /> Filtrer</button>
        <Link href="/admin/commandes" className="btn btn-ghost btn-sm" style={{ minHeight: 42 }}>Réinitialiser</Link>
      </form>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Commande</th><th>Client</th><th>Zone</th><th>Date</th><th>Statut</th><th>Paiement</th><th>Total</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7} className="hint">Aucune commande ne correspond.</td></tr>}
            {rows.map((o) => (
              <tr key={o.id}>
                <td><Link className="row-link" href={`/admin/commandes/${o.id}`}>{o.order_number}</Link>{o.is_demo && <> <span className="demo-tag">démo</span></>}</td>
                <td>{o.customer_first_name} {o.customer_last_name}<br /><span className="hint">{o.customer_phone}</span></td>
                <td>{o.delivery_zone_name}</td>
                <td>{new Date(o.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Africa/Porto-Novo' })}</td>
                <td><span className={`badge ${statusBadge(o.status)}`}>{ORDER_STATUSES[o.status]}</span></td>
                <td><span className={`badge ${payBadge(o.payment_status)}`}>{PAYMENT_STATUSES[o.payment_status]}</span></td>
                <td>{o.total_amount === null ? 'Sur devis' : formatMoney(Number(o.total_amount), o.currency, s.commerce.locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'center' }}>
          {page > 1 && <Link className="btn btn-ghost btn-sm" href={`?${qs(page - 1)}`}>← Précédent</Link>}
          <span className="hint">Page {page} / {pages}</span>
          {page < pages && <Link className="btn btn-ghost btn-sm" href={`?${qs(page + 1)}`}>Suivant →</Link>}
        </div>
      )}
    </>
  );
}
