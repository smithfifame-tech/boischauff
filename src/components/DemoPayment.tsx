'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import { api } from '@/lib/client';

export function DemoPayment({ txId, token, orderNumber, amount, status }: { txId: string; token: string; orderNumber: string; amount: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string>('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const q = `order=${encodeURIComponent(orderNumber)}&t=${encodeURIComponent(token)}`;
  const run = async (outcome: 'success' | 'failed' | 'pending') => {
    setBusy(outcome); setError(''); setMsg('');
    try {
      const r = await api<{ outcome: string }>('/api/payments/demo', { body: { txId, token, outcome } });
      if (r.outcome === 'paid' || r.outcome === 'already_paid') router.push(`/paiement/retour?${q}`);
      else if (r.outcome === 'failed') router.push(`/paiement/retour?${q}`);
      else { setMsg('Transaction laissée « en attente » : la commande reste non payée.'); setBusy(''); }
    } catch (e) { setError((e as Error).message); setBusy(''); }
  };
  return (
    <div className="card card-pad" style={{ border: '3px dashed var(--orange)' }}>
      <p className="alert alert-warn"><AlertTriangle size={18} aria-hidden /> <span><strong>MODE DÉMONSTRATION</strong> — aucune carte ni compte mobile money n&apos;est débité. Configurez SaaSPay pour encaisser de vrais paiements.</span></p>
      <dl className="kv" style={{ margin: '16px 0' }}>
        <dt>Commande</dt><dd>{orderNumber}</dd>
        <dt>Transaction</dt><dd>{txId}</dd>
        <dt>Montant</dt><dd style={{ fontSize: '1.4rem', color: 'var(--green)' }}>{amount}</dd>
        <dt>Statut actuel</dt><dd>{status}</dd>
      </dl>
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      {msg && <p className="alert alert-info">{msg}</p>}
      <div style={{ display: 'grid', gap: 10 }}>
        <button className="btn btn-green btn-lg" disabled={Boolean(busy)} onClick={() => run('success')}>{busy === 'success' ? <Loader2 size={18} className="spin" /> : <CheckCircle2 size={18} />} Simuler un paiement réussi</button>
        <button className="btn btn-danger" disabled={Boolean(busy)} onClick={() => run('failed')}>{busy === 'failed' ? <Loader2 size={18} className="spin" /> : <XCircle size={18} />} Simuler un paiement refusé</button>
        <button className="btn btn-ghost" disabled={Boolean(busy)} onClick={() => run('pending')}>{busy === 'pending' ? <Loader2 size={18} className="spin" /> : <Clock size={18} />} Simuler un paiement en attente</button>
      </div>
    </div>
  );
}
