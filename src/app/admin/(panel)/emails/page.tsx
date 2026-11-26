import Link from 'next/link';
import { db } from '@/lib/db';
import { RetryEmailButton } from '@/components/admin/RetryEmailButton';
import { mailTransportName } from '@/lib/mailer';

export default async function AdminEmails() {
  const rows = await db()<{ id: number; order_id: number | null; order_number: string | null; template: string; recipient: string; subject: string; status: string; error: string; attempts: number; updated_at: Date }[]>`
    select l.id, l.order_id, o.order_number, l.template, l.recipient, l.subject, l.status, l.error, l.attempts, l.updated_at
    from email_logs l left join orders o on o.id = l.order_id order by l.updated_at desc limit 200`;
  return (
    <>
      <div className="admin-head"><h1>Journal des e-mails</h1></div>
      {mailTransportName() === 'none' && <p className="alert alert-warn" style={{ marginBottom: 14 }}>Aucun service d&apos;envoi configuré : renseignez SMTP_HOST / SMTP_USER / SMTP_PASS (ou RESEND_API_KEY) puis relancez les envois.</p>}
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Date</th><th>Modèle</th><th>Destinataire</th><th>Commande</th><th>Statut</th><th>Détail</th><th></th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7} className="hint">Aucun envoi pour le moment.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.updated_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Africa/Porto-Novo' })}</td>
                <td>{r.template}<br /><span className="hint">{r.subject}</span></td>
                <td>{r.recipient}</td>
                <td>{r.order_id ? <Link className="row-link" href={`/admin/commandes/${r.order_id}`}>{r.order_number}</Link> : '—'}</td>
                <td><span className={`badge ${r.status === 'sent' ? 'b-green' : r.status === 'failed' ? 'b-red' : 'b-grey'}`}>{r.status === 'sent' ? 'Envoyé' : r.status === 'failed' ? 'Échec' : 'Non envoyé'}</span><br /><span className="hint">{r.attempts} tentative(s)</span></td>
                <td className="hint" style={{ maxWidth: 260 }}>{r.error}</td>
                <td>{r.status !== 'sent' && r.order_id ? <RetryEmailButton logId={r.id} /> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
