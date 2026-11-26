import { db } from '@/lib/db';

export default async function AdminMessages() {
  const rows = await db()<{ id: number; name: string; email: string; phone: string; subject: string; message: string; created_at: Date }[]>`
    select id, name, email, phone, subject, message, created_at from contact_messages order by created_at desc limit 200`;
  return (
    <>
      <div className="admin-head"><h1>Messages de contact</h1></div>
      {rows.length === 0 && <p className="hint">Aucun message.</p>}
      {rows.map((m) => (
        <div className="panel" key={m.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <strong>{m.name} · <a href={`mailto:${m.email}`} style={{ color: 'var(--green)' }}>{m.email}</a>{m.phone ? ` · ${m.phone}` : ''}</strong>
            <span className="hint">{new Date(m.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Paris' })}</span>
          </div>
          {m.subject && <p style={{ margin: '6px 0', fontWeight: 700 }}>{m.subject}</p>}
          <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{m.message}</p>
        </div>
      ))}
    </>
  );
}
