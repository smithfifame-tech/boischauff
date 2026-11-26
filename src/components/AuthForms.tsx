'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '@/lib/client';

function safeNext(n: string | null) { return n && n.startsWith('/') && !n.startsWith('//') ? n : '/compte'; }

function useForm<T extends Record<string, string>>(init: T) {
  const [f, setF] = useState(init);
  const set = (k: keyof T) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  return { f, set };
}

export function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const { f, set } = useForm({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    try { await api('/api/auth/login', { body: f }); router.push(next); router.refresh(); } catch (err) { setError((err as Error).message); setBusy(false); }
  };
  return (
    <form className="card card-pad" onSubmit={submit} style={{ maxWidth: 460, margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.4rem' }}>Connexion</h2>
      <div className="field" style={{ marginBottom: 14 }}><label className="label" htmlFor="l-email">E-mail</label><input id="l-email" type="email" className="input" autoComplete="email" required value={f.email} onChange={set('email')} /></div>
      <div className="field" style={{ marginBottom: 8 }}><label className="label" htmlFor="l-pw">Mot de passe</label><input id="l-pw" type="password" className="input" autoComplete="current-password" required value={f.password} onChange={set('password')} /></div>
      <p style={{ textAlign: 'right', margin: '0 0 12px' }}><Link href="/compte/mot-de-passe-oublie" className="hint" style={{ textDecoration: 'underline' }}>Mot de passe oublié ?</Link></p>
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <button className="btn btn-primary btn-block" disabled={busy}>{busy && <Loader2 size={18} className="spin" />} Se connecter</button>
      <p className="hint" style={{ textAlign: 'center', marginTop: 16, marginBottom: 0 }}>Pas encore de compte ? <Link href={`/compte/inscription?next=${encodeURIComponent(next)}`} style={{ color: 'var(--orange)', fontWeight: 800 }}>Créer un compte</Link></p>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const { f, set } = useForm({ firstName: '', lastName: '', email: '', phone: '', password: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (f.password !== f.confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    setBusy(true);
    try { await api('/api/auth/register', { body: { firstName: f.firstName, lastName: f.lastName, email: f.email, phone: f.phone, password: f.password } }); router.push(next); router.refresh(); }
    catch (err) { setError((err as Error).message); setBusy(false); }
  };
  return (
    <form className="card card-pad" onSubmit={submit} style={{ maxWidth: 620, margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.4rem' }}>Créer mon compte</h2>
      <div className="form-grid">
        <div className="field"><label className="label" htmlFor="r-fn">Prénom</label><input id="r-fn" className="input" autoComplete="given-name" required value={f.firstName} onChange={set('firstName')} /></div>
        <div className="field"><label className="label" htmlFor="r-ln">Nom</label><input id="r-ln" className="input" autoComplete="family-name" required value={f.lastName} onChange={set('lastName')} /></div>
        <div className="field"><label className="label" htmlFor="r-em">E-mail</label><input id="r-em" type="email" className="input" autoComplete="email" required value={f.email} onChange={set('email')} /></div>
        <div className="field"><label className="label" htmlFor="r-ph">Téléphone <span className="opt">(facultatif)</span></label><input id="r-ph" type="tel" className="input" autoComplete="tel" value={f.phone} onChange={set('phone')} /></div>
        <div className="field"><label className="label" htmlFor="r-pw">Mot de passe</label><input id="r-pw" type="password" className="input" autoComplete="new-password" required minLength={10} value={f.password} onChange={set('password')} /><span className="hint">10 caractères minimum, lettres et chiffres.</span></div>
        <div className="field"><label className="label" htmlFor="r-pw2">Confirmation</label><input id="r-pw2" type="password" className="input" autoComplete="new-password" required value={f.confirm} onChange={set('confirm')} /></div>
      </div>
      {error && <p className="alert alert-error" role="alert" style={{ marginTop: 14 }}>{error}</p>}
      <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={busy}>{busy && <Loader2 size={18} className="spin" />} Créer mon compte</button>
      <p className="hint" style={{ textAlign: 'center', marginTop: 16, marginBottom: 0 }}>Déjà inscrit ? <Link href={`/compte/connexion?next=${encodeURIComponent(next)}`} style={{ color: 'var(--orange)', fontWeight: 800 }}>Se connecter</Link></p>
    </form>
  );
}

export function ForgotForm() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    try { await api('/api/auth/forgot', { body: { email } }); setDone(true); } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  };
  if (done) return <div className="card card-pad" style={{ maxWidth: 460, margin: '0 auto', textAlign: 'center' }}><CheckCircle2 size={44} color="var(--success)" style={{ margin: '0 auto 8px' }} aria-hidden /><h2>Vérifiez votre boîte mail</h2><p className="hint">Si un compte existe pour cette adresse, un lien de réinitialisation (valable 1 heure) vient d&apos;être envoyé.</p></div>;
  return (
    <form className="card card-pad" onSubmit={submit} style={{ maxWidth: 460, margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.4rem' }}>Mot de passe oublié</h2>
      <div className="field" style={{ marginBottom: 14 }}><label className="label" htmlFor="f-em">E-mail du compte</label><input id="f-em" type="email" className="input" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <button className="btn btn-primary btn-block" disabled={busy}>{busy && <Loader2 size={18} className="spin" />} Recevoir le lien</button>
    </form>
  );
}

export function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get('token') || '';
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (pw !== pw2) { setError('Les mots de passe ne correspondent pas.'); return; }
    setBusy(true);
    try { await api('/api/auth/reset', { body: { token, password: pw } }); router.push('/compte'); router.refresh(); } catch (err) { setError((err as Error).message); setBusy(false); }
  };
  if (!token) return <p className="alert alert-error" style={{ maxWidth: 460, margin: '0 auto' }}>Lien invalide.</p>;
  return (
    <form className="card card-pad" onSubmit={submit} style={{ maxWidth: 460, margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.4rem' }}>Nouveau mot de passe</h2>
      <div className="field" style={{ marginBottom: 14 }}><label className="label" htmlFor="n-pw">Nouveau mot de passe</label><input id="n-pw" type="password" className="input" autoComplete="new-password" required minLength={10} value={pw} onChange={(e) => setPw(e.target.value)} /></div>
      <div className="field" style={{ marginBottom: 14 }}><label className="label" htmlFor="n-pw2">Confirmation</label><input id="n-pw2" type="password" className="input" autoComplete="new-password" required value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <button className="btn btn-primary btn-block" disabled={busy}>{busy && <Loader2 size={18} className="spin" />} Enregistrer</button>
    </form>
  );
}
