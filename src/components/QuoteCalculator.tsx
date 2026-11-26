'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calculator, ShoppingCart, Truck } from 'lucide-react';
import { useSite } from './SiteProvider';
import { formatQty, quoteDelivery, quoteLine, toKg, type Unit } from '@/lib/pricing';

const QUICK = [50, 100, 250, 500, 1000, 2000];

export function QuoteCalculator({ variant = 'compact', initialProductId }: { variant?: 'compact' | 'full'; initialProductId?: number }) {
  const { products, zones, money, add, zoneId, setZoneId, commerce } = useSite();
  const router = useRouter();
  const [productId, setProductId] = useState<number>((initialProductId && products.some((p) => p.id === initialProductId) ? initialProductId : undefined) ?? products.find((p) => p.slug === 'bois-dur')?.id ?? products[0]?.id ?? 0);
  const [qty, setQty] = useState<string>('500');
  const [unit, setUnit] = useState<Unit>('kg');
  const product = products.find((p) => p.id === productId);
  const zone = zones.find((z) => z.id === zoneId) ?? null;

  const q = useMemo(() => {
    const n = Number(String(qty).replace(',', '.'));
    if (!product) return null;
    return quoteLine({ ...product, rules: product.rules }, n, unit);
  }, [product, qty, unit]);
  const delivery = q?.ok ? quoteDelivery(zone, q.totalCents) : null;
  const wood = q?.ok ? q.totalCents / 100 : 0;
  const fee = delivery && delivery.feeCents !== null ? delivery.feeCents / 100 : null;
  const tax = q?.ok ? Math.round((q.totalCents + (delivery?.feeCents ?? 0)) * commerce.taxRate) / 100 : 0;
  const total = wood + (fee ?? 0) + tax;
  const belowMin = q?.ok && wood < commerce.minOrderAmount;

  if (!product) return <div className="calc">Aucun produit disponible pour le moment.</div>;

  const order = (go: boolean) => {
    if (!q?.ok) return;
    add({ productId, quantity: Number(String(qty).replace(',', '.')), unit });
    router.push(go ? '/commande' : '/panier');
  };

  return (
    <div className="calc" id="calculateur">
      <div className="calc-title"><Calculator size={26} aria-hidden /> Calculez votre devis</div>
      <div className="field">
        <label className="label" htmlFor="calc-product">Type de bois</label>
        <select id="calc-product" className="select" value={productId} onChange={(e) => setProductId(Number(e.target.value))}>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name} — {money(p.base_price_per_kg)}/kg</option>)}
        </select>
      </div>
      <div className="field">
        <label className="label" htmlFor="calc-qty">Quantité</label>
        <div className="calc-row">
          <input id="calc-qty" className="input" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value.replace(/[^0-9.,]/g, ''))} aria-describedby="calc-hint" />
          <select className="select" aria-label="Unité" value={unit} onChange={(e) => {
            const u = e.target.value as Unit;
            const n = Number(String(qty).replace(',', '.')) || 0;
            if (u !== unit) setQty(String(u === 't' ? n / 1000 : n * 1000));
            setUnit(u);
          }}>
            {product.allowed_units.includes('kg') && <option value="kg">kg</option>}
            {product.allowed_units.includes('t') && <option value="t">tonne</option>}
          </select>
        </div>
      </div>
      <div className="calc-quick" aria-label="Quantités rapides">
        {QUICK.map((k) => {
          const on = q?.quantityKg === k;
          return <button type="button" key={k} className={on ? 'on' : ''} onClick={() => { setUnit('kg'); setQty(String(k)); }}>{formatQty(k)}</button>;
        })}
      </div>
      {variant === 'full' || zones.length > 0 ? (
        <div className="field">
          <label className="label" htmlFor="calc-zone">Zone de livraison</label>
          <select id="calc-zone" className="select" value={zoneId ?? ''} onChange={(e) => setZoneId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">Choisir ma zone…</option>
            {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
        </div>
      ) : null}
      {q && !q.ok && <p className="calc-error" role="alert">{q.error}</p>}
      {belowMin && <p className="calc-error" role="alert">Commande minimum : {money(commerce.minOrderAmount)} de bois.</p>}
      <div className="calc-summary" aria-live="polite" id="calc-hint">
        <div><span>Quantité</span><strong>{q ? formatQty(q.quantityKg || toKg(Number(qty) || 0, unit)) : '—'}</strong></div>
        <div><span>Prix unitaire{q?.ok && q.savingsCents > 0 ? ` (${q.label})` : ''}</span><strong>{money(q?.ok ? q.unitPriceKg : product.base_price_per_kg)}/kg</strong></div>
        <div><span>Montant du bois</span><strong>{q?.ok ? money(wood) : '—'}</strong></div>
        {q?.ok && q.savingsCents > 0 && <div className="saving"><span>Économie dégressive</span><strong>- {money(q.savingsCents / 100)}</strong></div>}
        <div><span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><Truck size={16} aria-hidden /> Livraison</span>
          <strong>{!zone ? 'À calculer' : delivery?.requiresQuote ? 'Sur devis' : fee === 0 ? 'Offerte' : fee !== null ? money(fee) : '—'}</strong></div>
        {tax > 0 && <div><span>{commerce.taxLabel}</span><strong>{money(tax)}</strong></div>}
      </div>
      <div className="calc-total">
        <small>Total estimé</small>
        <strong>{q?.ok ? `${money(total)}${!zone || delivery?.requiresQuote ? ' + livraison' : ''}` : '—'}</strong>
      </div>
      <button type="button" className="btn btn-primary btn-block" disabled={!q?.ok || Boolean(belowMin)} onClick={() => order(true)}>
        <ShoppingCart size={18} aria-hidden /> Commander cette quantité
      </button>
      {variant === 'full' && (
        <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 8 }} disabled={!q?.ok} onClick={() => order(false)}>
          Ajouter au panier et continuer
        </button>
      )}
      {product.is_demo_price && <p className="hint" style={{ marginTop: 8, marginBottom: 0 }}><span className="demo-tag">Prix démo</span> Tarifs indicatifs à confirmer.</p>}
    </div>
  );
}
