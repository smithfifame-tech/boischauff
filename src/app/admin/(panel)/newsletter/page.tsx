import { Download } from 'lucide-react';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminNewsletter() {
  const rows = await db()<{ email: string; created_at: Date; unsubscribed_at: Date | null }[]>`
    select email, created_at, unsubscribed_at from newsletter_subscribers order by created_at desc limit 1000`;
  const active = rows.filter((r) => !r.unsubscribed_at).length;
  return (
    <>
      <div className="admin-head"><h1>Newsletter</h1><a href="/api/admin/newsletter" className="btn btn-primary btn-sm"><Download size={16} aria-hidden /> Exporter (CSV)</a></div>
      <p className="hint" style={{ marginTop: -10 }}>{active} inscrit(s) actif(s). Les inscrits ont donné leur consentement explicite ; l&apos;export sert à importer la liste dans votre outil d&apos;envoi.</p>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>E-mail</th><th>Inscription</th><th>Statut</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.email}><td>{r.email}</td><td>{new Date(r.created_at).toLocaleDateString('fr-FR')}</td><td>{r.unsubscribed_at ? <span className="badge b-grey">Désinscrit</span> : <span className="badge b-green">Actif</span>}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </>
  );
}
