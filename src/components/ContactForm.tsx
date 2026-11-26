'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { api } from '@/lib/client';

export function ContactForm() {
  const [f, setF] = useState({ name: '', email: '', phone: '', subject: '', message: '', website: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    try { await api('/api/contact', { body: f }); setDone(true); } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  };
  if (done) return <div className="card card-pad" style={{ textAlign: 'center' }}><CheckCircle2 size={48} color="var(--success)" style={{ margin: '0 auto 8px' }} aria-hidden /><h2>Message envoyé</h2><p className="hint">Merci ! Nous vous répondrons dans les meilleurs délais.</p></div>;
  return (
    <form className="card card-pad" onSubmit={submit}>
      <h2 style={{ fontSize: '1.3rem' }}>Envoyer un message</h2>
      <div className="form-grid">
        <div className="field"><label className="label" htmlFor="c-name">Nom complet</label><input id="c-name" className="input" required value={f.name} onChange={set('name')} autoComplete="name" /></div>
        <div className="field"><label className="label" htmlFor="c-email">E-mail</label><input id="c-email" type="email" className="input" required value={f.email} onChange={set('email')} autoComplete="email" /></div>
        <div className="field"><label className="label" htmlFor="c-phone">Téléphone <span className="opt">(facultatif)</span></label><input id="c-phone" type="tel" className="input" value={f.phone} onChange={set('phone')} autoComplete="tel" /></div>
        <div className="field"><label className="label" htmlFor="c-subject">Sujet</label><input id="c-subject" className="input" value={f.subject} onChange={set('subject')} /></div>
        <div className="field full"><label className="label" htmlFor="c-msg">Message</label><textarea id="c-msg" className="textarea" required minLength={10} value={f.message} onChange={set('message')} /></div>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} style={{ position: 'absolute', left: '-9999px' }} aria-hidden />
      </div>
      {error && <p className="alert alert-error" role="alert" style={{ marginTop: 14 }}>{error}</p>}
      <button className="btn btn-primary" style={{ marginTop: 16 }} disabled={busy}>{busy ? <Loader2 size={18} className="spin" /> : <Send size={18} />} Envoyer</button>
    </form>
  );
}
