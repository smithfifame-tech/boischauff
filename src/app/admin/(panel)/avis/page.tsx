import { db } from '@/lib/db';
import { ReviewActions } from '@/components/admin/ReviewActions';

export const dynamic = 'force-dynamic';
const LABEL: Record<string, [string, string]> = { pending: ['À modérer', 'b-orange'], approved: ['Publié', 'b-green'], rejected: ['Refusé', 'b-red'] };

export default async function AdminReviews() {
  const rows = await db()<{ id: number; order_number: string; author_name: string; city: string; rating: number; comment: string; status: string; created_at: Date }[]>`
    select r.id, o.order_number, r.author_name, r.city, r.rating, r.comment, r.status, r.created_at
    from reviews r join orders o on o.id = r.order_id order by (r.status = 'pending') desc, r.created_at desc limit 300`;
  const pending = rows.filter((r) => r.status === 'pending').length;
  return (
    <>
      <div className="admin-head"><h1>Avis clients</h1><span className="badge b-orange">{pending} à modérer</span></div>
      <p className="hint" style={{ marginTop: -10 }}>Seuls les clients ayant une commande réellement payée peuvent déposer un avis. Un avis n&apos;apparaît sur le site qu&apos;après publication.</p>
      {rows.length === 0 && <p className="hint">Aucun avis pour le moment.</p>}
      {rows.map((r) => (
        <div className="panel" key={r.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <strong>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)} · {r.author_name}{r.city ? ` (${r.city})` : ''} · {r.order_number}</strong>
            <span className={`badge ${LABEL[r.status]?.[1]}`}>{LABEL[r.status]?.[0]}</span>
          </div>
          <p style={{ whiteSpace: 'pre-wrap', margin: '8px 0 12px' }}>{r.comment}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="hint">{new Date(r.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Paris' })}</span>
            <ReviewActions id={Number(r.id)} status={r.status} />
          </div>
        </div>
      ))}
    </>
  );
}
