'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole } from 'lucide-react';
import { api } from '@/lib/client';

/**
 * Connexion express : e-mail + mot de passe → « Continuer ».
 * Compte existant : connexion. Nouvel e-mail : compte créé automatiquement.
 */
export function QuickAuth({ title = 'Connectez-vous pour commander', subtitle = 'Un seul formulaire : nous vous connectons, ou créons votre compte en 1 clic.', next }: { title?: string; subtitle?: string; next?: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const target = next ?? (() => { const n = sp.get('next') || ''; return n.startsWith('/') && !n.startsWith('//') ? n : undefined; })();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const r = await api<{ created: boolean }>('/api/auth/quick', { body: { email, password } });
      setCreated(r.created);
      if (target) router.push(target);
      router.refresh();
    } catch (err) { setError((err as Error).message); setBusy(false); }
  };

  return (
    <div className="card card-pad quick-auth" data-reveal="zoom">
      <div className="qa-head">
        <span className="ico"><LockKeyhole size={26} aria-hidden /></span>
        <div><h2>{title}</h2><p>{subtitle}</p></div>
      </div>
      {created ? <p className="alert alert-success"><CheckCircle2 size={18} aria-hidden /> Compte créé, vous êtes connecté.</p> : null}
      <form onSubmit={submit} noValidate>
        <div className="field">
          <label className="label" htmlFor="qa-email">Adresse e-mail</label>
          <input id="qa-email" className="input" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.fr" />
        </div>
        <div className="field">
          <label className="label" htmlFor="qa-pw">Mot de passe</label>
          <div className="pw-wrap">
            <input id="qa-pw" className="input" type={show ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="10 caractères, lettres et chiffres" />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
        </div>
        {error && <p className="alert alert-error" role="alert">{error}</p>}
        <button className="btn btn-primary btn-lg btn-block" disabled={busy || !email || !password}>
          {busy ? <Loader2 size={18} className="spin" aria-hidden /> : null} Continuer <ArrowRight size={18} aria-hidden />
        </button>
        <div className="qa-perks">
          <span><CheckCircle2 size={14} aria-hidden /> Pas de compte ? Il est créé automatiquement</span>
          <span><CheckCircle2 size={14} aria-hidden /> Suivi et reçus au même endroit</span>
        </div>
        <p className="hint" style={{ margin: 0 }}><Link href="/compte/mot-de-passe-oublie" style={{ textDecoration: 'underline' }}>Mot de passe oublié ?</Link></p>
      </form>
    </div>
  );
}
