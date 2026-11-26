'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, ShoppingCart, Trash2 } from 'lucide-react';
import { useSite } from './SiteProvider';
import { img, PHOTOS } from '@/lib/img';
import { useServerQuote } from './useServerQuote';
import { OrderSummary } from './OrderSummary';
import { quoteLine, type Unit } from '@/lib/pricing';

export function CartView() {
  const { items, products, zones, update, remove, money, ready, zoneId, setZoneId } = useSite();
  const { quote, loading } = useServerQuote(items, zoneId, ready);

  if (!ready) return <p className="hint">Chargement du panier…</p>;
  if (!items.length) {
    return (
      <div className="card empty-state">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img(PHOTOS.stack, 440, 300)} alt="" className="float-slow" />
        <h2><ShoppingCart size={26} aria-hidden style={{ verticalAlign: '-4px' }} /> Votre panier est vide</h2>
        <p className="hint">Choisissez votre bois et la quantité souhaitée pour obtenir un devis instantané.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/boutique" className="btn btn-green">Voir la boutique</Link>
          <Link href="/devis" className="btn btn-primary">Calculer un devis</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="two-col">
      <div>
        <div className="card">
          {items.map((it) => {
            const p = products.find((x) => x.id === it.productId);
            if (!p) return null;
            const q = quoteLine(p, it.quantity, it.unit);
            return (
              <div className="cart-line" key={it.productId}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img(p.image, 200, 160)} alt={p.image_alt} loading="lazy" />
                <div>
                  <h3><Link href={`/produits/${p.slug}`}>{p.name}</Link></h3>
                  <div className="hint">Prix unitaire : <strong>{money(q.ok ? q.unitPriceKg : p.base_price_per_kg)}/kg</strong>{q.ok && q.savingsCents > 0 ? ` · ${q.label}` : ''}</div>
                  <div className="cart-qty">
                    <input className="input" inputMode="decimal" aria-label={`Quantité de ${p.name}`} defaultValue={String(it.quantity)}
                      key={`${it.productId}-${it.unit}`}
                      onChange={(e) => { const n = Number(e.target.value.replace(',', '.')); if (n > 0) update(it.productId, { quantity: n }); }} />
                    <select className="select" aria-label="Unité" value={it.unit} onChange={(e) => {
                      const u = e.target.value as Unit;
                      if (u !== it.unit) update(it.productId, { unit: u, quantity: u === 't' ? it.quantity / 1000 : it.quantity * 1000 });
                    }}>
                      {p.allowed_units.includes('kg') && <option value="kg">kg</option>}
                      {p.allowed_units.includes('t') && <option value="t">tonne</option>}
                    </select>
                    <button type="button" className="icon-btn" onClick={() => remove(it.productId)} aria-label={`Retirer ${p.name}`}><Trash2 size={18} /></button>
                  </div>
                  {!q.ok && <div className="field-error" role="alert">{q.error}</div>}
                </div>
                <div className="line-total" style={{ textAlign: 'right' }}>
                  <strong style={{ fontSize: '1.15rem' }}>{q.ok ? money(q.totalCents / 100) : '—'}</strong>
                  {q.ok && q.savingsCents > 0 && <div className="saving" style={{ fontSize: '.85rem' }}>- {money(q.savingsCents / 100)}</div>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="card card-pad" style={{ marginTop: 18 }}>
          <label className="label" htmlFor="cart-zone">Zone de livraison (estimation des frais)</label>
          <select id="cart-zone" className="select" style={{ marginTop: 6 }} value={zoneId ?? ''} onChange={(e) => setZoneId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">Choisir ma zone…</option>
            {zones.map((z) => <option key={z.id} value={z.id}>{z.name}{z.lead_time ? ` — ${z.lead_time}` : ''}</option>)}
          </select>
        </div>
        <div style={{ marginTop: 18 }}>
          <Link href="/boutique" className="btn btn-ghost"><ArrowLeft size={18} aria-hidden /> Continuer mes achats</Link>
        </div>
      </div>
      <div className="sticky">
        <OrderSummary quote={quote} loading={loading}>
          <Link href="/commande" className={`btn btn-primary btn-block btn-lg${quote && !quote.ok && quote.errors.some((e) => !e.includes('zone')) ? ' disabled' : ''}`} style={{ marginTop: 16 }}
            aria-disabled={Boolean(quote && !quote.ok)} onClick={(e) => { if (quote && !quote.ok) e.preventDefault(); }}>
            Passer la commande <ArrowRight size={18} aria-hidden />
          </Link>
        </OrderSummary>
      </div>
    </div>
  );
}
