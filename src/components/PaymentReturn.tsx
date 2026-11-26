'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import { api } from '@/lib/client';

type State = 'checking' | 'paid' | 'failed' | 'pending';

export function PaymentReturn({ orderNumber, token }: { orderNumber: string; token: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>('checking');
  const [reason, setReason] = useState('');
  const q = `order=${encodeURIComponent(orderNumber)}&t=${encodeURIComponent(token)}`;

  useEffect(() => {
    let tries = 0;
    let stop = false;
    const check = async () => {
      tries++;
      try {
        const r = await api<{ paymentStatus: string; lastTransaction: { status: string; reason: string } | null }>('/api/payments/verify', { body: { orderNumber, token } });
        if (stop) return;
        if (r.paymentStatus === 'paid') { setState('paid'); setTimeout(() => router.replace(`/commande/confirmation?${q}`), 1200); return; }
        if (r.lastTransaction?.status === 'failed' || r.lastTransaction?.status === 'cancelled') { setState('failed'); setReason(r.lastTransaction.reason); return; }
        if (tries >= 20) { setState('pending'); return; }
      } catch { if (tries >= 20) { setState('pending'); return; } }
      setTimeout(check, 3000);
    };
    check();
    return () => { stop = true; };
  }, [orderNumber, token, q, router]);

  return (
    <div className="card card-pad" style={{ textAlign: 'center' }} aria-live="polite">
      {state === 'checking' && (<><Loader2 size={48} className="spin" color="var(--green)" aria-hidden style={{ margin: '0 auto 10px' }} /><h2>Vérification en cours…</h2><p className="hint">Merci de patienter quelques secondes. Ne fermez pas cette page.</p></>)}
      {state === 'paid' && (<><CheckCircle2 size={56} color="var(--success)" aria-hidden style={{ margin: '0 auto 10px' }} /><h2>Paiement confirmé !</h2><p className="hint">Redirection vers votre confirmation…</p></>)}
      {state === 'failed' && (<><XCircle size={56} color="var(--danger)" aria-hidden style={{ margin: '0 auto 10px' }} /><h2>Paiement refusé</h2>
        <p className="hint">{reason || 'La transaction n\'a pas abouti.'} Aucun montant n&apos;a été validé.</p>
        <Link href={`/commande/paiement?${q}`} className="btn btn-primary">Réessayer le paiement</Link></>)}
      {state === 'pending' && (<><Clock size={56} color="var(--orange)" aria-hidden style={{ margin: '0 auto 10px' }} /><h2>Paiement en attente</h2>
        <p className="hint">La passerelle n&apos;a pas encore confirmé votre paiement (cela peut prendre quelques minutes, notamment pour le mobile money). Vous recevrez un e-mail dès la confirmation.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-green" onClick={() => window.location.reload()}>Vérifier à nouveau</button>
          <Link href={`/commande/confirmation?${q}`} className="btn btn-ghost">Voir ma commande</Link>
        </div></>)}
    </div>
  );
}
