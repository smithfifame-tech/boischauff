'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';
import { api } from '@/lib/client';

export function AccountProfile({ user, address }: { user: { firstName: string; lastName: string; email: string; phone: string }; address: { line1: string; line2: string; city: string; postalCode: string; country: string } | null }) {
  const router = useRouter();
  const [f, setF] = useState({ ...user, line1: address?.line1 ?? '', line2: address?.line2 ?? '', city: address?.city ?? '', postalCode: address?.postalCode ?? '', country: address?.country ?? 'France' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      await api('/api/account/profile', { method: 'PUT', body: { firstName: f.firstName, lastName: f.lastName, phone: f.phone,
        address: f.line1.trim() ? { line1: f.line1, line2: f.line2, city: f.city, postalCode: f.postalCode, country: f.country } : null } });
      setMsg({ ok: true, t: 'Profil enregistré.' }); router.refresh();
    } catch (err) { setMsg({ ok: false, t: (err as Error).message }); } finally { setBusy(false); }
  };
  return (
    <form className="card card-pad" onSubmit={save}>
      <h2 style={{ fontSize: '1.2rem' }}>Profil</h2>
      <p className="hint" style={{ marginTop: -6 }}>{user.email}</p>
      <div className="form-grid">
        <div className="field"><label className="label" htmlFor="p-fn">Prénom</label><input id="p-fn" className="input" value={f.firstName} onChange={set('firstName')} required /></div>
        <div className="field"><label className="label" htmlFor="p-ln">Nom</label><input id="p-ln" className="input" value={f.lastName} onChange={set('lastName')} required /></div>
        <div className="field full"><label className="label" htmlFor="p-ph">Téléphone</label><input id="p-ph" className="input" value={f.phone} onChange={set('phone')} /></div>
      </div>
      <h3 style={{ fontSize: '1.05rem', marginTop: 18 }}>Adresse de livraison par défaut</h3>
      <div className="form-grid">
        <div className="field full"><label className="label" htmlFor="p-l1">Adresse</label><input id="p-l1" className="input" value={f.line1} onChange={set('line1')} /></div>
        <div className="field full"><label className="label" htmlFor="p-l2">Complément</label><input id="p-l2" className="input" value={f.line2} onChange={set('line2')} /></div>
        <div className="field"><label className="label" htmlFor="p-ci">Ville</label><input id="p-ci" className="input" value={f.city} onChange={set('city')} /></div>
        <div className="field"><label className="label" htmlFor="p-pc">Code postal</label><input id="p-pc" className="input" value={f.postalCode} onChange={set('postalCode')} /></div>
        <div className="field full"><label className="label" htmlFor="p-co">Pays</label><input id="p-co" className="input" value={f.country} onChange={set('country')} /></div>
      </div>
      {msg && <p className={`alert ${msg.ok ? 'alert-success' : 'alert-error'}`} style={{ marginTop: 12 }}>{msg.t}</p>}
      <button className="btn btn-green btn-block" style={{ marginTop: 14 }} disabled={busy}>{busy ? <Loader2 size={18} className="spin" /> : <Save size={18} />} Enregistrer</button>
    </form>
  );
}
