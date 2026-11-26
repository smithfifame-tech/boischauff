'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, Save, Send, Truck } from 'lucide-react';
import { api } from '@/lib/client';

const STATUS_OPTIONS: [string, string][] = [
  ['pending_payment', 'En attente de paiement'], ['paid', 'Paiement confirmé'], ['preparing', 'En préparation'],
  ['shipping', 'En cours de livraison'], ['delivered', 'Livrée'], ['cancelled', 'Annulée'],
];

export function OrderActions(p: { id: number; status: string; paymentStatus: string; deliveryFee: number | null; internalNote: string; currency: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [status, setStatus] = useState(p.status === 'awaiting_quote' ? 'pending_payment' : p.status);
  const [note, setNote] = useState('');
  const [notify, setNotify] = useState(true);
  const [fee, setFee] = useState(p.deliveryFee === null ? '' : String(p.deliveryFee));
  const [internal, setInternal] = useState(p.internalNote);
  const [info, setInfo] = useState('');

  const run = async (key: string, body: Record<string, unknown>, ok: string) => {
    setBusy(key); setMsg(null);
    try { await api(`/api/admin/orders/${p.id}`, { method: 'PATCH', body }); setMsg({ ok: true, t: ok }); router.refresh(); }
    catch (e) { setMsg({ ok: false, t: (e as Error).message }); } finally { setBusy(''); }
  };
  const paid = p.paymentStatus === 'paid';

  return (
    <>
      {msg && <p className={`alert ${msg.ok ? 'alert-success' : 'alert-error'}`} role="status" style={{ marginBottom: 12 }}>{msg.t}</p>}
      {!paid && p.status !== 'cancelled' && (
        <div className="panel">
          <h2><Truck size={18} aria-hidden style={{ verticalAlign: '-3px' }} /> Frais de livraison</h2>
          <p className="hint">{p.status === 'awaiting_quote' ? 'Cette commande attend votre chiffrage : le client pourra payer dès validation.' : 'Modifier les frais recalcule le total à payer.'}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input" inputMode="decimal" placeholder={`Montant (${p.currency})`} value={fee} onChange={(e) => setFee(e.target.value.replace(/[^0-9.,]/g, ''))} />
            <button className="btn btn-primary btn-sm" disabled={busy !== '' || fee === ''} onClick={() => run('fee', { action: 'delivery_fee', fee: Number(fee.replace(',', '.')), notify: true }, 'Frais enregistrés — le client a été notifié.')}>
              {busy === 'fee' ? <Loader2 size={16} className="spin" /> : <Send size={16} />} Valider
            </button>
          </div>
        </div>
      )}
      <div className="panel">
        <h2>Statut de la commande</h2>
        {!paid && <p className="hint">Les statuts « paiement confirmé », « préparation », « livraison » et « livrée » ne sont possibles qu&apos;après un paiement vérifié par la passerelle.</p>}
        <div className="field" style={{ marginBottom: 10 }}>
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Nouveau statut">
            {STATUS_OPTIONS.map(([k, v]) => <option key={k} value={k} disabled={!paid && ['paid', 'preparing', 'shipping', 'delivered'].includes(k)}>{v}</option>)}
          </select>
        </div>
        <textarea className="textarea" style={{ minHeight: 70 }} placeholder="Message visible par le client (facultatif) : créneau de livraison, nom du livreur…" value={note} onChange={(e) => setNote(e.target.value)} />
        <label className="checkbox" style={{ margin: '10px 0' }}><input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> Prévenir le client par e-mail</label>
        <button className="btn btn-green btn-block" disabled={busy !== ''} onClick={() => run('status', { action: 'status', status, note, notify }, 'Statut mis à jour.')}>
          {busy === 'status' ? <Loader2 size={16} className="spin" /> : <Save size={16} />} Mettre à jour le statut
        </button>
      </div>
      <div className="panel">
        <h2>Information de livraison</h2>
        <textarea className="textarea" style={{ minHeight: 60 }} placeholder="Ajouter une information visible dans le suivi (ex. livraison prévue jeudi matin)" value={info} onChange={(e) => setInfo(e.target.value)} />
        <button className="btn btn-ghost btn-block" style={{ marginTop: 8 }} disabled={busy !== '' || info.trim().length < 2} onClick={async () => { await run('info', { action: 'tracking', note: info }, 'Information ajoutée au suivi.'); setInfo(''); }}>
          {busy === 'info' ? <Loader2 size={16} className="spin" /> : null} Ajouter au suivi
        </button>
      </div>
      <div className="panel">
        <h2>Note interne</h2>
        <textarea className="textarea" placeholder="Visible uniquement par l'équipe" value={internal} onChange={(e) => setInternal(e.target.value)} />
        <button className="btn btn-ghost btn-block" style={{ marginTop: 8 }} disabled={busy !== ''} onClick={() => run('note', { action: 'note', note: internal }, 'Note enregistrée.')}>
          {busy === 'note' ? <Loader2 size={16} className="spin" /> : <Save size={16} />} Enregistrer la note
        </button>
      </div>
      <div className="panel">
        <h2>E-mails de confirmation</h2>
        <button className="btn btn-ghost btn-block" disabled={busy !== ''} onClick={() => run('mail', { action: 'resend_emails' }, 'E-mails renvoyés (voir le journal).')}>
          {busy === 'mail' ? <Loader2 size={16} className="spin" /> : <Mail size={16} />} Renvoyer les e-mails
        </button>
      </div>
    </>
  );
}
