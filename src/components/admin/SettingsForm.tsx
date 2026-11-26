'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';
import { api } from '@/lib/client';
import type { AllSettings } from '@/lib/settings';

export function SettingsForm({ initial }: { initial: AllSettings }) {
  const router = useRouter();
  const [s, setS] = useState<AllSettings>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const c = <K extends keyof AllSettings['company']>(k: K, v: AllSettings['company'][K]) => setS((p) => ({ ...p, company: { ...p.company, [k]: v } }));
  const m = <K extends keyof AllSettings['commerce']>(k: K, v: AllSettings['commerce'][K]) => setS((p) => ({ ...p, commerce: { ...p.commerce, [k]: v } }));
  const soc = (k: keyof AllSettings['company']['social'], v: string) => setS((p) => ({ ...p, company: { ...p.company, social: { ...p.company.social, [k]: v } } }));
  const save = async () => {
    setBusy(true); setMsg(null);
    try { await api('/api/admin/settings', { method: 'PUT', body: s }); setMsg({ ok: true, t: 'Paramètres enregistrés.' }); router.refresh(); }
    catch (e) { setMsg({ ok: false, t: (e as Error).message }); } finally { setBusy(false); }
  };
  const field = (label: string, value: string, on: (v: string) => void, opts: { full?: boolean; type?: string; ph?: string } = {}) => (
    <div className={`field${opts.full ? ' full' : ''}`}><label className="label">{label}</label><input className="input" type={opts.type || 'text'} placeholder={opts.ph} value={value} onChange={(e) => on(e.target.value)} /></div>
  );
  return (
    <>
      <div className="panel">
        <h2>Entreprise & identité</h2>
        <div className="form-grid">
          {field('Nom de l\'entreprise', s.company.name, (v) => c('name', v))}
          {field('Slogan', s.company.tagline, (v) => c('tagline', v))}
          {field('Téléphone', s.company.phone, (v) => c('phone', v))}
          {field('E-mail public', s.company.email, (v) => c('email', v), { type: 'email' })}
          {field('Adresse', s.company.address, (v) => c('address', v), { full: true })}
          {field('Zone de livraison (bandeau)', s.company.delivery_area, (v) => c('delivery_area', v), { full: true })}
          {field('Horaires', s.company.opening_hours, (v) => c('opening_hours', v), { full: true })}
          {field('Logo (URL https, vide = logo provisoire)', s.company.logo_url, (v) => c('logo_url', v), { full: true, ph: 'https://…' })}
          {(['primary_color', 'primary_dark', 'accent_color', 'gold_color'] as const).map((k) => (
            <div className="field" key={k}><label className="label">{{ primary_color: 'Vert principal', primary_dark: 'Vert foncé', accent_color: 'Orange (actions)', gold_color: 'Jaune doré' }[k]}</label>
              <div style={{ display: 'flex', gap: 8 }}><input type="color" value={s.company[k]} onChange={(e) => c(k, e.target.value.toUpperCase())} style={{ width: 52, height: 48, border: 0, background: 'none' }} />
                <input className="input" value={s.company[k]} onChange={(e) => c(k, e.target.value)} /></div></div>
          ))}
        </div>
      </div>
      <div className="panel">
        <h2>Réseaux sociaux</h2>
        <div className="form-grid">
          {field('Facebook (URL)', s.company.social.facebook, (v) => soc('facebook', v))}
          {field('WhatsApp (numéro ou lien)', s.company.social.whatsapp, (v) => soc('whatsapp', v))}
          {field('YouTube (URL)', s.company.social.youtube, (v) => soc('youtube', v))}
          {field('TikTok (URL)', s.company.social.tiktok, (v) => soc('tiktok', v))}
          {field('Instagram (URL)', s.company.social.instagram, (v) => soc('instagram', v))}
        </div>
      </div>
      <div className="panel">
        <h2>Vente, devise & taxes</h2>
        <div className="form-grid">
          {field('Devise (ISO)', s.commerce.currency, (v) => m('currency', v.toUpperCase()), { ph: 'EUR, XOF…' })}
          {field('Format régional', s.commerce.locale, (v) => m('locale', v), { ph: 'fr-FR' })}
          {field('Libellé taxe', s.commerce.tax_label, (v) => m('tax_label', v))}
          <div className="field"><label className="label">Taux de taxe (%)</label><input className="input" inputMode="decimal" value={Math.round(s.commerce.tax_rate * 10000) / 100} onChange={(e) => m('tax_rate', (Number(e.target.value.replace(',', '.')) || 0) / 100)} /></div>
          <div className="field"><label className="label">Montant minimum de commande</label><input className="input" inputMode="decimal" value={s.commerce.min_order_amount} onChange={(e) => m('min_order_amount', Number(e.target.value.replace(',', '.')) || 0)} /></div>
        </div>
        <label className="checkbox" style={{ marginTop: 12 }}><input type="checkbox" checked={s.commerce.guest_checkout} onChange={(e) => m('guest_checkout', e.target.checked)} /> Autoriser la commande sans compte (paiement invité)</label>
        <label className="checkbox" style={{ marginTop: 8 }}><input type="checkbox" checked={s.commerce.show_demo_notice} onChange={(e) => m('show_demo_notice', e.target.checked)} /> Afficher les mentions « démonstration » sur le site</label>
      </div>
      <div className="panel">
        <h2>Commandes, e-mails & reçus</h2>
        <div className="form-grid">
          {field('E-mail de réception des commandes', s.notifications.order_email, (v) => setS((p) => ({ ...p, notifications: { order_email: v } })), { full: true, type: 'email' })}
          <div className="field full"><label className="label">Message de pied de reçu</label><textarea className="textarea" style={{ minHeight: 70 }} value={s.receipt.footer} onChange={(e) => setS((p) => ({ ...p, receipt: { ...p.receipt, footer: e.target.value } }))} /></div>
          <div className="field full"><label className="label">Mentions légales du reçu (RCCM, IFU…)</label><textarea className="textarea" style={{ minHeight: 70 }} value={s.receipt.legal_mentions} onChange={(e) => setS((p) => ({ ...p, receipt: { ...p.receipt, legal_mentions: e.target.value } }))} /></div>
        </div>
      </div>
      {msg && <p className={`alert ${msg.ok ? 'alert-success' : 'alert-error'}`} role="status" style={{ marginBottom: 12 }}>{msg.t}</p>}
      <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? <Loader2 size={18} className="spin" /> : <Save size={18} />} Enregistrer les paramètres</button>
    </>
  );
}
