'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Mail, Send } from 'lucide-react';
import { api } from '@/lib/client';
import { SocialIcons } from './SocialIcons';

export function Newsletter({ social, phone }: { social: Record<string, string>; phone?: string }) {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(null);
    if (!consent) { setMsg({ ok: false, text: 'Cochez la case pour accepter de recevoir nos e-mails.' }); return; }
    setBusy(true);
    try { await api('/api/newsletter', { body: { email, consent: true } }); setMsg({ ok: true, text: 'Merci, vous êtes inscrit !' }); setEmail(''); }
    catch (err) { setMsg({ ok: false, text: (err as Error).message }); } finally { setBusy(false); }
  };
  return (
    <section className="newsletter" aria-label="Newsletter">
      <div className="container">
        <Mail size={42} className="icon" aria-hidden />
        <div><strong>Inscrivez-vous à notre newsletter</strong><small>Offres de saison et conseils pour bien vous chauffer.</small></div>
        <div className="nl-wrap">
          <form className="nl-form" onSubmit={submit}>
            <label htmlFor="nl-email" className="sr-only">Votre adresse e-mail</label>
            <input id="nl-email" type="email" required placeholder="Votre adresse e-mail…" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            <button className="btn btn-primary" disabled={busy}>{busy ? <Loader2 size={16} className="spin" aria-hidden /> : <Send size={16} aria-hidden />} S&apos;abonner</button>
          </form>
          <label className="nl-consent"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> J&apos;accepte de recevoir les e-mails de GodenWood. Désinscription en un clic.</label>
          {msg && <p className="nl-msg" role="status" style={{ color: msg.ok ? '#7BD88F' : '#FF9C8A' }}>{msg.ok && <CheckCircle2 size={15} aria-hidden style={{ verticalAlign: '-3px' }} />} {msg.text}</p>}
        </div>
        <div className="follow">Suivez-nous <SocialIcons social={social} phone={phone} /></div>
      </div>
    </section>
  );
}
