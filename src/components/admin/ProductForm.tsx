'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { api } from '@/lib/client';

type Rule = { rule_type: 'tier' | 'pack'; label: string; min_qty_kg: number | null; price_per_kg: number | null; pack_qty_kg: number | null; pack_price: number | null };
export interface ProductFormValue {
  id?: number; slug: string; name: string; short_description: string; description: string; species: string; drying_level: string; moisture: string;
  recommended_use: string; features: string[]; base_price_per_kg: number; sale_unit: string; allowed_units: ('kg' | 't')[]; min_qty_kg: number;
  max_qty_kg: number | null; stock_kg: number | null; is_active: boolean; is_featured: boolean; is_demo_price: boolean; badge: string; sort_order: number;
  images: { url: string; alt: string }[]; rules: Rule[];
}

const EMPTY: ProductFormValue = {
  slug: '', name: '', short_description: '', description: '', species: '', drying_level: '', moisture: '', recommended_use: '', features: [],
  base_price_per_kg: 0, sale_unit: 'kg', allowed_units: ['kg', 't'], min_qty_kg: 50, max_qty_kg: 20000, stock_kg: null, is_active: true,
  is_featured: false, is_demo_price: false, badge: '', sort_order: 10, images: [], rules: [],
};
const slugify = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const numOrNull = (v: string) => (v.trim() === '' ? null : Number(v.replace(',', '.')));

export function ProductForm({ value, currency }: { value: ProductFormValue | null; currency: string }) {
  const router = useRouter();
  const [f, setF] = useState<ProductFormValue>(value ?? EMPTY);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const set = <K extends keyof ProductFormValue>(k: K, v: ProductFormValue[K]) => setF((p) => ({ ...p, [k]: v }));
  const txt = (k: keyof ProductFormValue) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k, e.target.value as never);

  const save = async () => {
    setBusy(true); setMsg(null);
    try {
      const body = { ...f, slug: f.slug || slugify(f.name), features: f.features.filter(Boolean), images: f.images.filter((i) => i.url.trim()) };
      delete (body as { id?: number }).id;
      const r = await api<{ id: number }>(value?.id ? `/api/admin/products/${value.id}` : '/api/admin/products', { method: value?.id ? 'PUT' : 'POST', body });
      setMsg({ ok: true, t: 'Produit enregistré.' });
      if (!value?.id) router.replace(`/admin/produits/${r.id}`);
      router.refresh();
    } catch (e) { setMsg({ ok: false, t: (e as Error).message }); } finally { setBusy(false); }
  };
  const del = async () => {
    if (!value?.id || !window.confirm('Supprimer ce produit ? S\'il figure dans des commandes, il sera simplement désactivé.')) return;
    setBusy(true);
    try { await api(`/api/admin/products/${value.id}`, { method: 'DELETE', body: {} }); router.push('/admin/produits'); router.refresh(); }
    catch (e) { setMsg({ ok: false, t: (e as Error).message }); setBusy(false); }
  };

  return (
    <div className="admin-grid">
      <div>
        <div className="panel">
          <h2>Informations</h2>
          <div className="form-grid">
            <div className="field"><label className="label">Nom</label><input className="input" value={f.name} onChange={(e) => { const n = e.target.value; setF((p) => ({ ...p, name: n, slug: value?.id ? p.slug : slugify(n) })); }} /></div>
            <div className="field"><label className="label">Identifiant d&apos;URL</label><input className="input" value={f.slug} onChange={(e) => set('slug', slugify(e.target.value))} /></div>
            <div className="field full"><label className="label">Accroche</label><input className="input" value={f.short_description} onChange={txt('short_description')} /></div>
            <div className="field full"><label className="label">Description</label><textarea className="textarea" value={f.description} onChange={txt('description')} /></div>
            <div className="field"><label className="label">Essence de bois</label><input className="input" value={f.species} onChange={txt('species')} /></div>
            <div className="field"><label className="label">Niveau de séchage</label><input className="input" value={f.drying_level} onChange={txt('drying_level')} /></div>
            <div className="field"><label className="label">Humidité</label><input className="input" value={f.moisture} onChange={txt('moisture')} /></div>
            <div className="field"><label className="label">Usage recommandé</label><input className="input" value={f.recommended_use} onChange={txt('recommended_use')} /></div>
            <div className="field full"><label className="label">Caractéristiques (une par ligne)</label><textarea className="textarea" style={{ minHeight: 80 }} value={f.features.join('\n')} onChange={(e) => set('features', e.target.value.split('\n'))} /></div>
          </div>
        </div>
        <div className="panel">
          <h2>Images</h2>
          {f.images.map((im, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '64px 1fr 1fr auto', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {im.url ? <img src={im.url.includes('unsplash') ? `${im.url.split('?')[0]}?w=120&q=60&auto=format` : im.url} alt="" style={{ width: 64, height: 48, objectFit: 'cover', borderRadius: 6 }} /> : <span />}
              <input className="input" placeholder="https://…" value={im.url} onChange={(e) => set('images', f.images.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
              <input className="input" placeholder="Texte alternatif" value={im.alt} onChange={(e) => set('images', f.images.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))} />
              <button type="button" className="icon-btn" aria-label="Retirer" onClick={() => set('images', f.images.filter((_, j) => j !== i))}><Trash2 size={16} /></button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => set('images', [...f.images, { url: '', alt: '' }])}><ImagePlus size={16} /> Ajouter une image (URL https)</button>
          <p className="hint" style={{ marginTop: 8, marginBottom: 0 }}>La première image est l&apos;image principale. Hébergez vos photos (Vercel Blob, Cloudinary, Unsplash…) et collez leur lien.</p>
        </div>
        <div className="panel">
          <h2>Tarifs dégressifs & forfaits</h2>
          <p className="hint">Palier : prix au kg appliqué à partir d&apos;une quantité. Forfait : prix fixe pour une quantité exacte (ex. 50 kg, 100 kg, 1 tonne).</p>
          {f.rules.map((r, i) => (
            <div className="rule-row" key={i}>
              <div className="field"><label className="label">Type</label>
                <select className="select" value={r.rule_type} onChange={(e) => set('rules', f.rules.map((x, j) => (j === i ? { ...x, rule_type: e.target.value as Rule['rule_type'] } : x)))}>
                  <option value="tier">Palier</option><option value="pack">Forfait</option></select></div>
              <div className="field"><label className="label">Libellé</label><input className="input" value={r.label} onChange={(e) => set('rules', f.rules.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} /></div>
              {r.rule_type === 'tier' ? (<>
                <div className="field"><label className="label">Dès (kg)</label><input className="input" inputMode="decimal" value={r.min_qty_kg ?? ''} onChange={(e) => set('rules', f.rules.map((x, j) => (j === i ? { ...x, min_qty_kg: numOrNull(e.target.value) } : x)))} /></div>
                <div className="field"><label className="label">Prix/kg ({currency})</label><input className="input" inputMode="decimal" value={r.price_per_kg ?? ''} onChange={(e) => set('rules', f.rules.map((x, j) => (j === i ? { ...x, price_per_kg: numOrNull(e.target.value) } : x)))} /></div>
              </>) : (<>
                <div className="field"><label className="label">Quantité (kg)</label><input className="input" inputMode="decimal" value={r.pack_qty_kg ?? ''} onChange={(e) => set('rules', f.rules.map((x, j) => (j === i ? { ...x, pack_qty_kg: numOrNull(e.target.value) } : x)))} /></div>
                <div className="field"><label className="label">Prix ({currency})</label><input className="input" inputMode="decimal" value={r.pack_price ?? ''} onChange={(e) => set('rules', f.rules.map((x, j) => (j === i ? { ...x, pack_price: numOrNull(e.target.value) } : x)))} /></div>
              </>)}
              <button type="button" className="icon-btn" aria-label="Supprimer la règle" onClick={() => set('rules', f.rules.filter((_, j) => j !== i))}><Trash2 size={16} /></button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => set('rules', [...f.rules, { rule_type: 'tier', label: '', min_qty_kg: null, price_per_kg: null, pack_qty_kg: null, pack_price: null }])}><Plus size={16} /> Palier</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => set('rules', [...f.rules, { rule_type: 'pack', label: '', min_qty_kg: null, price_per_kg: null, pack_qty_kg: null, pack_price: null }])}><Plus size={16} /> Forfait</button>
          </div>
        </div>
      </div>
      <div>
        <div className="panel">
          <h2>Prix & quantités</h2>
          <div className="field" style={{ marginBottom: 10 }}><label className="label">Prix de base au kg ({currency})</label><input className="input" inputMode="decimal" value={f.base_price_per_kg} onChange={(e) => set('base_price_per_kg', Number(e.target.value.replace(',', '.')) || 0)} /></div>
          <div className="field" style={{ marginBottom: 10 }}><label className="label">Unité de vente affichée</label><input className="input" value={f.sale_unit} onChange={txt('sale_unit')} /></div>
          <div className="field" style={{ marginBottom: 10 }}><span className="label">Unités autorisées</span>
            <div style={{ display: 'flex', gap: 16 }}>{(['kg', 't'] as const).map((u) => (
              <label className="checkbox" key={u}><input type="checkbox" checked={f.allowed_units.includes(u)} onChange={(e) => set('allowed_units', e.target.checked ? [...f.allowed_units, u] : f.allowed_units.filter((x) => x !== u))} /> {u === 'kg' ? 'Kilogramme' : 'Tonne'}</label>))}</div></div>
          <div className="form-grid">
            <div className="field"><label className="label">Minimum (kg)</label><input className="input" inputMode="decimal" value={f.min_qty_kg} onChange={(e) => set('min_qty_kg', Number(e.target.value.replace(',', '.')) || 0)} /></div>
            <div className="field"><label className="label">Maximum (kg)</label><input className="input" inputMode="decimal" placeholder="illimité" value={f.max_qty_kg ?? ''} onChange={(e) => set('max_qty_kg', numOrNull(e.target.value))} /></div>
            <div className="field full"><label className="label">Stock (kg)</label><input className="input" inputMode="decimal" placeholder="vide = non suivi" value={f.stock_kg ?? ''} onChange={(e) => set('stock_kg', numOrNull(e.target.value))} /></div>
          </div>
        </div>
        <div className="panel">
          <h2>Publication</h2>
          <label className="checkbox" style={{ marginBottom: 8 }}><input type="checkbox" checked={f.is_active} onChange={(e) => set('is_active', e.target.checked)} /> Produit actif (visible en boutique)</label>
          <label className="checkbox" style={{ marginBottom: 8 }}><input type="checkbox" checked={f.is_featured} onChange={(e) => set('is_featured', e.target.checked)} /> Mis en avant sur l&apos;accueil</label>
          <label className="checkbox" style={{ marginBottom: 12 }}><input type="checkbox" checked={f.is_demo_price} onChange={(e) => set('is_demo_price', e.target.checked)} /> Prix de démonstration (affiche la mention « démo »)</label>
          <div className="form-grid">
            <div className="field"><label className="label">Badge</label><input className="input" placeholder="Ex. Meilleure vente" value={f.badge} onChange={txt('badge')} /></div>
            <div className="field"><label className="label">Ordre</label><input className="input" inputMode="numeric" value={f.sort_order} onChange={(e) => set('sort_order', Number(e.target.value) || 0)} /></div>
          </div>
        </div>
        {msg && <p className={`alert ${msg.ok ? 'alert-success' : 'alert-error'}`} role="status" style={{ marginBottom: 12 }}>{msg.t}</p>}
        <button className="btn btn-primary btn-block" onClick={save} disabled={busy}>{busy ? <Loader2 size={18} className="spin" /> : <Save size={18} />} Enregistrer</button>
        {value?.id && <button className="btn btn-danger btn-block" style={{ marginTop: 10 }} onClick={del} disabled={busy}><Trash2 size={18} /> Supprimer</button>}
      </div>
    </div>
  );
}
