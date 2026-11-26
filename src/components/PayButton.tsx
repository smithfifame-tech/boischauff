'use client';

import { useState } from 'react';
import { AlertTriangle, CreditCard, Loader2, Lock } from 'lucide-react';
import { api } from '@/lib/client';

export function PayButton({ orderNumber, token, label }: { orderNumber: string; token: string; label: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pay = async () => {
    setBusy(true); setError('');
    try {
      const r = await api<{ redirectUrl: string }>('/api/payments/init', { body: { orderNumber, token } });
      window.location.assign(r.redirectUrl);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };
  return (
    <div>
      {error && <p className="alert alert-error" role="alert"><AlertTriangle size={18} aria-hidden /> {error}</p>}
      <button type="button" className="btn btn-primary btn-block btn-lg" onClick={pay} disabled={busy}>
        {busy ? <><Loader2 size={19} className="spin" aria-hidden /> Connexion à la passerelle…</> : <><CreditCard size={19} aria-hidden /> {label}</>}
      </button>
      <p className="secure-note"><Lock size={15} aria-hidden /> Paiement chiffré — aucune donnée bancaire ne transite par notre site</p>
    </div>
  );
}
