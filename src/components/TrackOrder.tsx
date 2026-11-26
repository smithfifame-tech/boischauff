'use client';

import { useState } from 'react';
import { CheckCircle2, CreditCard, Loader2, Package, PackageCheck, Search, Truck } from 'lucide-react';
import { api } from '@/lib/client';
import { formatMoney, formatQty } from '@/lib/pricing';

interface Tracked {
  orderNumber: string; status: string; statusLabel: string; paymentStatus: string; paymentLabel: string; step: number; cancelled: boolean;
  createdAt: string; city: string; zone: string; desiredDate: string | null; items: { name: string; quantityKg: number }[];
  total: number | null; currency: string; history: { status: string; note: string; at: string }[];
}
const STEPS = [
  { label: 'Commande reçue', icon: Package },
  { label: 'Paiement confirmé', icon: CreditCard },
  { label: 'En préparation', icon: PackageCheck },
  { label: 'En cours de livraison', icon: Truck },
  { label: 'Livrée', icon: CheckCircle2 },
];

export function TrackOrder({ initialOrder }: { initialOrder: string }) {
  const [order, setOrder] = useState(initialOrder);
  const [contact, setContact] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<Tracked | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(''); setData(null);
    try {
      const r = await api<{ order: Tracked }>('/api/track', { body: { orderNumber: order.trim(), contact: contact.trim() } });
      setData(r.order);
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  };
  const pct = data ? (data.step / (STEPS.length - 1)) * 80 : 0;

  return (
    <div>
      <form className="card card-pad" onSubmit={submit}>
        <div className="form-grid">
          <div className="field"><label className="label" htmlFor="t-order">Numéro de commande</label>
            <input id="t-order" className="input" placeholder="BC-261126-XXXXX" value={order} onChange={(e) => setOrder(e.target.value.toUpperCase())} required /></div>
          <div className="field"><label className="label" htmlFor="t-contact">E-mail ou téléphone de vérification</label>
            <input id="t-contact" className="input" placeholder="vous@exemple.com ou +229…" value={contact} onChange={(e) => setContact(e.target.value)} required /></div>
        </div>
        {error && <p className="alert alert-error" role="alert" style={{ marginTop: 14 }}>{error}</p>}
        <button className="btn btn-primary" style={{ marginTop: 16 }} disabled={busy}>{busy ? <Loader2 size={18} className="spin" /> : <Search size={18} />} Suivre ma commande</button>
      </form>

      {data && (
        <div className="card card-pad" style={{ marginTop: 22 }} aria-live="polite">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div><h2 style={{ fontSize: '1.3rem', margin: 0 }}>Commande {data.orderNumber}</h2>
              <span className="hint">Passée le {new Date(data.createdAt).toLocaleDateString('fr-FR', { dateStyle: 'long' })} · {data.zone}{data.city ? ` · ${data.city}` : ''}</span></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className={`badge ${data.cancelled ? 'b-red' : 'b-blue'}`}>{data.statusLabel}</span>
              <span className={`badge ${data.paymentStatus === 'paid' ? 'b-green' : 'b-orange'}`}>{data.paymentLabel}</span>
            </div>
          </div>
          {!data.cancelled && (
            <div className="timeline" role="list" aria-label="Progression de la commande">
              <div className="progress" style={{ width: `${pct}%` }} />
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const cls = i < data.step || (i === data.step && i === STEPS.length - 1) ? 'done' : i === data.step ? 'current' : '';
                return (<div key={s.label} className={`tl-step ${cls}`} role="listitem"><div className="tl-dot"><Icon size={20} aria-hidden /></div><span>{s.label}</span></div>);
              })}
            </div>
          )}
          <div className="form-grid">
            <div>
              <h3 style={{ fontSize: '1.05rem' }}>Contenu</h3>
              <ul style={{ paddingLeft: 18, margin: 0 }}>{data.items.map((i) => <li key={i.name}>{i.name} — {formatQty(i.quantityKg)}</li>)}</ul>
              <p style={{ marginTop: 10 }}><strong>Total : {data.total === null ? 'sur devis' : formatMoney(data.total, data.currency)}</strong></p>
              {data.desiredDate && <p className="hint">Date souhaitée : {new Date(data.desiredDate).toLocaleDateString('fr-FR')}</p>}
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem' }}>Historique</h3>
              <ul className="history">
                {data.history.slice().reverse().map((h, i) => (
                  <li key={i}><div><strong style={{ display: 'block' }}>{h.note || h.status}</strong><time>{new Date(h.at).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</time></div></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
