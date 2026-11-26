'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';
import { api } from '@/lib/client';

export function AdminLoginForm() {
  const router = useRouter();
  const nextRaw = useSearchParams().get('next') || '/admin';
  const next = nextRaw.startsWith('/admin') ? nextRaw : '/admin';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const r = await api<{ mustChangePassword: boolean }>('/api/admin/login', { body: { email, password } });
      router.push(r.mustChangePassword ? '/admin/mot-de-passe' : next); router.refresh();
    } catch (err) { setError((err as Error).message); setBusy(false); }
  };
  return (
    <form onSubmit={submit}>
      <div className="field" style={{ marginBottom: 14 }}><label className="label" htmlFor="a-em">E-mail administrateur</label><input id="a-em" type="email" className="input" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div className="field" style={{ marginBottom: 14 }}><label className="label" htmlFor="a-pw">Mot de passe</label><input id="a-pw" type="password" className="input" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <button className="btn btn-primary btn-block" disabled={busy}>{busy ? <Loader2 size={18} className="spin" /> : <Lock size={18} />} Connexion sécurisée</button>
    </form>
  );
}

export function AdminPasswordForm({ forced }: { forced: boolean }) {
  const router = useRouter();
  const [f, setF] = useState({ current: '', next: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (f.next !== f.confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    setBusy(true);
    try { await api('/api/admin/password', { body: { current: f.current, next: f.next } }); router.push('/admin'); router.refresh(); }
    catch (err) { setError((err as Error).message); setBusy(false); }
  };
  return (
    <form onSubmit={submit}>
      {forced && <p className="alert alert-warn">Pour sécuriser votre espace, choisissez un nouveau mot de passe personnel avant de continuer.</p>}
      {(['current', 'next', 'confirm'] as const).map((k) => (
        <div className="field" style={{ marginBottom: 14 }} key={k}>
          <label className="label" htmlFor={`ap-${k}`}>{k === 'current' ? 'Mot de passe actuel' : k === 'next' ? 'Nouveau mot de passe' : 'Confirmation'}</label>
          <input id={`ap-${k}`} type="password" className="input" required minLength={k === 'current' ? 1 : 10} autoComplete={k === 'current' ? 'current-password' : 'new-password'} value={f[k]} onChange={(e) => setF((p) => ({ ...p, [k]: e.target.value }))} />
        </div>
      ))}
      <p className="hint">10 caractères minimum, avec lettres et chiffres.</p>
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <button className="btn btn-primary btn-block" disabled={busy}>{busy && <Loader2 size={18} className="spin" />} Enregistrer</button>
    </form>
  );
}
