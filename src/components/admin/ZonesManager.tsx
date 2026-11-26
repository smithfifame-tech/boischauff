'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { api } from '@/lib/client';

interface Z { id?: number; name: string; description: string; mode: 'free' | 'fixed' | 'distance' | 'quote'; fixed_fee: number; per_km_fee: number; distance_km: number; free_above: number | null; min_order_amount: number | null; lead_time: string; is_active: boolean; is_demo: boolean; sort_order: number }
const NEW: Z = { name: '', description: '', mode: 'fixed', fixed_fee: 0, per_km_fee: 0, distance_km: 0, free_above: null, min_order_amount: null, lead_time: '', is_active: true, is_demo: false, sort_order: 10 };
const n = (v: string) => Number(v.replace(',', '.')) || 0;
const nn = (v: string) => (v.trim() === '' ? null : Number(v.replace(',', '.')));

function ZoneRow({ z, currency, onDone }: { z: Z; currency: string; onDone: () => void }) {
  const [f, setF] = useState<Z>(z);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const set = <K extends keyof Z>(k: K, v: Z[K]) => setF((p) => ({ ...p, [k]: v }));
  const save = async () => {
    setBusy(true); setMsg(null);
    try {
      const body = { ...f }; delete body.id;
      await api(z.id ? `/api/admin/zones/${z.id}` : '/api/admin/zones', { method: z.id ? 'PUT' : 'POST', body });
      setMsg({ ok: true, t: 'Enregistré.' }); onDone();
      if (!z.id) setF(NEW);
    } catch (e) { setMsg({ ok: false, t: (e as Error).message }); } finally { setBusy(false); }
  };
  const del = async () => {
    if (!z.id || !window.confirm('Supprimer cette zone ?')) return;
    setBusy(true);
    try { await api(`/api/admin/zones/${z.id}`, { method: 'DELETE', body: {} }); onDone(); } catch (e) { setMsg({ ok: false, t: (e as Error).message }); setBusy(false); }
  };
  return (
    <div className="panel">
      <div className="form-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0,1fr))' }}>
        <div className="field" style={{ gridColumn: 'span 2' }}><label className="label">Nom de la zone</label><input className="input" value={f.name} onChange={(e) => set('name', e.target.value)} /></div>
        <div className="field"><label className="label">Mode</label>
          <select className="select" value={f.mode} onChange={(e) => set('mode', e.target.value as Z['mode'])}>
            <option value="fixed">Tarif fixe</option><option value="distance">Selon la distance</option><option value="free">Gratuit</option><option value="quote">Sur devis</option></select></div>
        <div className="field"><label className="label">Délai indicatif</label><input className="input" value={f.lead_time} onChange={(e) => set('lead_time', e.target.value)} /></div>
        <div className="field" style={{ gridColumn: '1 / -1' }}><label className="label">Description</label><input className="input" value={f.description} onChange={(e) => set('description', e.target.value)} /></div>
        {(f.mode === 'fixed' || f.mode === 'distance') && <div className="field"><label className="label">{f.mode === 'distance' ? 'Base' : 'Frais'} ({currency})</label><input className="input" inputMode="decimal" defaultValue={f.fixed_fee} onChange={(e) => set('fixed_fee', n(e.target.value))} /></div>}
        {f.mode === 'distance' && <>
          <div className="field"><label className="label">{currency} / km</label><input className="input" inputMode="decimal" defaultValue={f.per_km_fee} onChange={(e) => set('per_km_fee', n(e.target.value))} /></div>
          <div className="field"><label className="label">Distance (km)</label><input className="input" inputMode="decimal" defaultValue={f.distance_km} onChange={(e) => set('distance_km', n(e.target.value))} /></div>
        </>}
        {f.mode !== 'quote' && f.mode !== 'free' && <div className="field"><label className="label">Offerte dès ({currency})</label><input className="input" inputMode="decimal" placeholder="—" defaultValue={f.free_above ?? ''} onChange={(e) => set('free_above', nn(e.target.value))} /></div>}
        <div className="field"><label className="label">Commande min. ({currency})</label><input className="input" inputMode="decimal" placeholder="—" defaultValue={f.min_order_amount ?? ''} onChange={(e) => set('min_order_amount', nn(e.target.value))} /></div>
        <div className="field"><label className="label">Ordre</label><input className="input" inputMode="numeric" defaultValue={f.sort_order} onChange={(e) => set('sort_order', Number(e.target.value) || 0)} /></div>
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginTop: 12 }}>
        <label className="checkbox"><input type="checkbox" checked={f.is_active} onChange={(e) => set('is_active', e.target.checked)} /> Active</label>
        <label className="checkbox"><input type="checkbox" checked={f.is_demo} onChange={(e) => set('is_demo', e.target.checked)} /> Tarif de démonstration</label>
        <span style={{ flex: 1 }} />
        {msg && <span className={msg.ok ? 'saving' : 'field-error'}>{msg.t}</span>}
        {z.id && <button className="btn btn-danger btn-sm" onClick={del} disabled={busy}><Trash2 size={15} /></button>}
        <button className="btn btn-green btn-sm" onClick={save} disabled={busy || f.name.trim().length < 2}>{busy ? <Loader2 size={15} className="spin" /> : z.id ? <Save size={15} /> : <Plus size={15} />} {z.id ? 'Enregistrer' : 'Ajouter la zone'}</button>
      </div>
    </div>
  );
}

export function ZonesManager({ zones, currency }: { zones: Z[]; currency: string }) {
  const router = useRouter();
  const refresh = () => router.refresh();
  return (
    <>
      {zones.map((z) => <ZoneRow key={`${z.id}-${z.name}-${z.mode}`} z={z} currency={currency} onDone={refresh} />)}
      <h2 style={{ fontSize: '1.1rem', marginTop: 24 }}>Nouvelle zone</h2>
      <ZoneRow z={NEW} currency={currency} onDone={refresh} />
    </>
  );
}
