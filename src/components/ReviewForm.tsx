'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, Star } from 'lucide-react';
import { api } from '@/lib/client';

export function ReviewForm({ orders }: { orders: { orderNumber: string; date: string }[] }) {
  const router = useRouter();
  const [orderNumber, setOrder] = useState(orders[0]?.orderNumber ?? '');
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!orders.length) return null;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      await api('/api/reviews', { body: { orderNumber, rating, comment } });
      setMsg({ ok: true, text: 'Merci ! Votre avis sera publié après vérification par notre équipe.' });
      setComment(''); router.refresh();
    } catch (err) { setMsg({ ok: false, text: (err as Error).message }); } finally { setBusy(false); }
  };
  const labels = ['Décevant', 'Moyen', 'Bien', 'Très bien', 'Excellent'];
  return (
    <form className="card card-pad" id="avis" onSubmit={submit} style={{ marginTop: 18 }}>
      <h2 style={{ fontSize: '1.2rem' }}>Donnez votre avis</h2>
      <p className="hint" style={{ marginTop: -4 }}>Réservé à vos commandes payées. Les avis sont vérifiés avant publication.</p>
      {orders.length > 1 && (
        <div className="field" style={{ marginBottom: 12 }}>
          <label className="label" htmlFor="rv-order">Commande</label>
          <select id="rv-order" className="select" value={orderNumber} onChange={(e) => setOrder(e.target.value)}>
            {orders.map((o) => <option key={o.orderNumber} value={o.orderNumber}>{o.orderNumber} — {new Date(o.date).toLocaleDateString('fr-FR')}</option>)}
          </select>
        </div>
      )}
      <div className="field" style={{ marginBottom: 12 }}>
        <span className="label">Votre note : {labels[(hover || rating) - 1]}</span>
        <div className="rating-input" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((i) => (
            <button type="button" key={i} className={i <= (hover || rating) ? 'on' : ''} onMouseEnter={() => setHover(i)} onClick={() => setRating(i)} aria-label={`${i} étoile${i > 1 ? 's' : ''}`} aria-pressed={rating === i}>
              <Star size={30} fill="currentColor" strokeWidth={0} aria-hidden />
            </button>
          ))}
        </div>
      </div>
      <div className="field" style={{ marginBottom: 12 }}>
        <label className="label" htmlFor="rv-comment">Votre commentaire</label>
        <textarea id="rv-comment" className="textarea" maxLength={1200} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Qualité du bois, livraison, accueil…" />
      </div>
      {msg && <p className={`alert ${msg.ok ? 'alert-success' : 'alert-error'}`} role="status">{msg.ok && <CheckCircle2 size={18} aria-hidden />}{msg.text}</p>}
      <button className="btn btn-primary" disabled={busy || comment.trim().length < 10}>{busy && <Loader2 size={18} className="spin" aria-hidden />} Publier mon avis</button>
    </form>
  );
}
