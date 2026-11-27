'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2, Lock, ShoppingCart } from 'lucide-react';
import { useSite } from './SiteProvider';
import { QuickAuth } from './QuickAuth';
import { zoneForPostal } from '@/lib/postal';
import { useServerQuote } from './useServerQuote';
import { OrderSummary } from './OrderSummary';
import { api, uid } from '@/lib/client';
import { quoteDelivery } from '@/lib/pricing';

const COUNTRIES = ['France', 'Belgique', 'Luxembourg', 'Suisse', 'Monaco', 'Allemagne', 'Espagne', 'Italie', 'Pays-Bas', 'Autriche', 'Portugal', 'Autre pays européen'];

interface Props {
  user: { firstName: string; lastName: string; email: string; phone: string } | null;
  address: { line1: string; line2: string; city: string; postalCode: string; country: string } | null;
}

export function CheckoutForm({ user, address }: Props) {
  const { items, zones, ready, money, clear, commerce, zoneId, setZoneId } = useSite();
  const router = useRouter();
  const idem = useRef<string>('');
  const [f, setF] = useState({
    firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', email: user?.email ?? '', phone: user?.phone ?? '',
    line1: address?.line1 ?? '', line2: address?.line2 ?? '', city: address?.city ?? '', postalCode: address?.postalCode ?? '', country: address?.country ?? 'France',
    instructions: '', desiredDate: '', saveAddress: Boolean(user), acceptTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [sending, setSending] = useState(false);
  const { quote, loading } = useServerQuote(items, zoneId, ready);
  // Zone détectée automatiquement à partir du code postal (modifiable ensuite).
  useEffect(() => {
    const z = zoneForPostal(zones, f.postalCode, f.country);
    if (z) setZoneId(z.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.postalCode, f.country, zones]);
  useEffect(() => { if (!idem.current) idem.current = uid(); }, []);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const v = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setF((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: '' }));
  };
  const minDate = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); }, []);

  if (!ready) return <p className="hint">Chargement…</p>;
  if (!items.length) {
    return (
      <div className="card empty-state">
        <ShoppingCart size={48} aria-hidden /><h2>Votre panier est vide</h2>
        <Link href="/devis" className="btn btn-primary">Calculer un devis</Link>
      </div>
    );
  }
  if (!user && !commerce.guestCheckout) {
    return (
      <QuickAuth />
    );
  }

  const validate = () => {
    const e: Record<string, string> = {};
    if (!f.firstName.trim()) e.firstName = 'Prénom requis.';
    if (!f.lastName.trim()) e.lastName = 'Nom requis.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) e.email = 'Adresse e-mail invalide.';
    if (!/^[+0-9 ().-]{6,25}$/.test(f.phone.trim())) e.phone = 'Numéro de téléphone invalide.';
    if (f.line1.trim().length < 3) e.line1 = 'Adresse requise.';
    if (f.city.trim().length < 2) e.city = 'Ville requise.';
    if (f.postalCode.trim().length < 3) e.postalCode = 'Code postal requis.';
    else if (f.country === 'France' && !/^\d{5}$/.test(f.postalCode.trim())) e.postalCode = 'Code postal français : 5 chiffres.';
    if (f.country.trim().length < 2) e.country = 'Pays requis.';
    if (!zoneId) e.zone = 'Choisissez votre zone de livraison.';
    if (!f.acceptTerms) e.acceptTerms = 'Veuillez accepter les conditions générales de vente.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSubmitError('');
    if (!validate()) { document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    setSending(true);
    try {
      const zone = zones.find((z) => z.id === zoneId);
      const r = await api<{ orderNumber: string; token: string }>('/api/checkout', {
        body: {
          idempotencyKey: idem.current, items, zoneId: zone ? zone.id : null,
          customer: { firstName: f.firstName, lastName: f.lastName, email: f.email, phone: f.phone },
          address: { line1: f.line1, line2: f.line2, city: f.city, postalCode: f.postalCode, country: f.country },
          instructions: f.instructions, desiredDate: f.desiredDate || null, saveAddress: f.saveAddress, acceptTerms: f.acceptTerms,
        },
      });
      clear();
      router.push(`/commande/paiement?order=${encodeURIComponent(r.orderNumber)}&t=${encodeURIComponent(r.token)}`);
    } catch (e) {
      setSubmitError((e as Error).message);
      setSending(false);
    }
  };

  const err = (k: string) => errors[k] ? <span className="field-error" role="alert">{errors[k]}</span> : null;
  const inv = (k: string) => (errors[k] ? 'true' : undefined);

  return (
    <form className="two-col" onSubmit={submit} noValidate>
      <div>
        {!user && (
          <p className="alert alert-info" style={{ marginBottom: 20 }}>
            <span>Déjà client ? <Link href="/compte/connexion?next=/commande" style={{ textDecoration: 'underline' }}>Connectez-vous</Link> pour retrouver vos adresses. Vous pouvez aussi commander sans compte.</span>
          </p>
        )}
        <div className="card card-pad form-section">
          <h2><span className="n">1</span> Vos coordonnées</h2>
          <div className="form-grid">
            <div className="field"><label className="label" htmlFor="firstName">Prénom</label><input id="firstName" className="input" autoComplete="given-name" value={f.firstName} onChange={set('firstName')} aria-invalid={inv('firstName')} />{err('firstName')}</div>
            <div className="field"><label className="label" htmlFor="lastName">Nom</label><input id="lastName" className="input" autoComplete="family-name" value={f.lastName} onChange={set('lastName')} aria-invalid={inv('lastName')} />{err('lastName')}</div>
            <div className="field"><label className="label" htmlFor="email">Adresse e-mail</label><input id="email" type="email" className="input" autoComplete="email" value={f.email} onChange={set('email')} aria-invalid={inv('email')} />{err('email')}</div>
            <div className="field"><label className="label" htmlFor="phone">Téléphone</label><input id="phone" type="tel" className="input" autoComplete="tel" placeholder="06 12 34 56 78" value={f.phone} onChange={set('phone')} aria-invalid={inv('phone')} />{err('phone')}</div>
          </div>
        </div>

        <div className="card card-pad form-section">
          <h2><span className="n">2</span> Adresse de livraison</h2>
          <div className="form-grid">
            <div className="field full"><label className="label" htmlFor="line1">Adresse complète</label><input id="line1" className="input" autoComplete="street-address" placeholder="12 rue des Chênes" value={f.line1} onChange={set('line1')} aria-invalid={inv('line1')} />{err('line1')}</div>
            <div className="field full"><label className="label" htmlFor="line2">Complément d&apos;adresse <span className="opt">(facultatif)</span></label><input id="line2" className="input" placeholder="Bâtiment, digicode, portail…" value={f.line2} onChange={set('line2')} /></div>
            <div className="field"><label className="label" htmlFor="city">Ville</label><input id="city" className="input" autoComplete="address-level2" value={f.city} onChange={set('city')} aria-invalid={inv('city')} />{err('city')}</div>
            <div className="field"><label className="label" htmlFor="postalCode">Code postal</label><input id="postalCode" className="input" inputMode="numeric" autoComplete="postal-code" placeholder="75001" value={f.postalCode} onChange={set('postalCode')} aria-invalid={inv('postalCode')} />{err('postalCode')}</div>
            <div className="field full"><label className="label" htmlFor="country">Pays</label>
              <select id="country" className="select" autoComplete="country-name" value={f.country} onChange={set('country')} aria-invalid={inv('country')}>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>{err('country')}</div>
          </div>
        </div>

        <div className="card card-pad form-section">
          <h2><span className="n">3</span> Livraison</h2>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="label" style={{ marginBottom: 8 }}>Zone de livraison</legend>
            <div className="zone-options" aria-invalid={inv('zone')}>
              {zones.map((z) => {
                const d = quoteDelivery(z, Math.round((quote?.woodSubtotal ?? 0) * 100));
                return (
                  <label className="zone-option" key={z.id}>
                    <input type="radio" name="zone" checked={zoneId === z.id} onChange={() => { setZoneId(z.id); setErrors((p) => ({ ...p, zone: '' })); }} />
                    <span><strong>{z.name}</strong>{z.is_demo && commerce.showDemoNotice ? <> <span className="demo-tag">démo</span></> : null}<br />
                      <span className="hint">{z.description}{z.lead_time ? ` · ${z.lead_time}` : ''}</span></span>
                    <span className="fee">{d.requiresQuote ? 'Sur devis' : d.feeCents === 0 ? 'Gratuit' : money((d.feeCents ?? 0) / 100)}</span>
                  </label>
                );
              })}
            </div>
            {err('zone')}
          </fieldset>
          <div className="form-grid" style={{ marginTop: 16 }}>
            <div className="field"><label className="label" htmlFor="desiredDate">Date de livraison souhaitée <span className="opt">(facultatif)</span></label><input id="desiredDate" type="date" min={minDate} className="input" value={f.desiredDate} onChange={set('desiredDate')} /></div>
            <div className="field full"><label className="label" htmlFor="instructions">Instructions pour le livreur <span className="opt">(facultatif)</span></label><textarea id="instructions" className="textarea" maxLength={1000} placeholder="Accès, horaires, lieu de dépôt du bois…" value={f.instructions} onChange={set('instructions')} /></div>
          </div>
        </div>

        <div className="card card-pad form-section">
          <h2><span className="n">4</span> Validation</h2>
          {user && <label className="checkbox" style={{ marginBottom: 12 }}><input type="checkbox" checked={f.saveAddress} onChange={set('saveAddress')} /> Enregistrer cette adresse dans mon compte</label>}
          <label className="checkbox"><input type="checkbox" checked={f.acceptTerms} onChange={set('acceptTerms')} aria-invalid={inv('acceptTerms')} />
            <span>J&apos;accepte les <Link href="/cgv" target="_blank" style={{ textDecoration: 'underline' }}>conditions générales de vente</Link> et la <Link href="/confidentialite" target="_blank" style={{ textDecoration: 'underline' }}>politique de confidentialité</Link>.</span></label>
          {err('acceptTerms')}
        </div>
      </div>

      <div className="sticky">
        <OrderSummary quote={quote} loading={loading} title="Votre devis">
          {submitError && <p className="alert alert-error" role="alert" style={{ marginTop: 14 }}><AlertTriangle size={18} aria-hidden /> {submitError}</p>}
          <button type="submit" className="btn btn-primary btn-block btn-lg" style={{ marginTop: 16 }} disabled={sending || Boolean(quote && !quote.ok)}>
            {sending ? <><Loader2 size={18} className="spin" aria-hidden /> Enregistrement…</> : quote?.delivery.requiresQuote ? 'Valider ma demande de devis' : 'Valider et passer au paiement'}
          </button>
          <p className="secure-note"><Lock size={15} aria-hidden /> Montant recalculé et vérifié par notre serveur</p>
        </OrderSummary>
      </div>
    </form>
  );
}
