'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ShoppingCart, Zap } from 'lucide-react';
import { useSite } from './SiteProvider';
import { formatQty, quoteLine, type Unit } from '@/lib/pricing';

export function AddToCart({ productId, compact = false, defaultQty }: { productId: number; compact?: boolean; defaultQty?: number }) {
  const { products, add, money } = useSite();
  const router = useRouter();
  const product = products.find((p) => p.id === productId);
  const [qty, setQty] = useState(String(defaultQty ?? product?.min_qty_kg ?? 50));
  const [unit, setUnit] = useState<Unit>('kg');
  const [added, setAdded] = useState(false);
  const q = useMemo(() => (product ? quoteLine(product, Number(qty.replace(',', '.')), unit) : null), [product, qty, unit]);
  if (!product) return null;

  const doAdd = (go: boolean) => {
    if (!q?.ok) return;
    add({ productId, quantity: Number(qty.replace(',', '.')), unit });
    if (go) router.push('/commande');
    else { setAdded(true); setTimeout(() => setAdded(false), 1800); }
  };

  return (
    <div className="product-actions">
      <div className="calc-row" style={{ gridTemplateColumns: compact ? '1fr 78px' : '1fr 110px' }}>
        <input className="input" inputMode="decimal" aria-label={`Quantité de ${product.name}`} value={qty}
          onChange={(e) => setQty(e.target.value.replace(/[^0-9.,]/g, ''))} style={{ minHeight: compact ? 42 : 48 }} />
        <select className="select" aria-label="Unité" value={unit} style={{ minHeight: compact ? 42 : 48 }} onChange={(e) => {
          const u = e.target.value as Unit; const n = Number(qty.replace(',', '.')) || 0;
          if (u !== unit) setQty(String(u === 't' ? n / 1000 : n * 1000));
          setUnit(u);
        }}>
          {product.allowed_units.includes('kg') && <option value="kg">kg</option>}
          {product.allowed_units.includes('t') && <option value="t">t</option>}
        </select>
      </div>
      <div style={{ fontSize: '.88rem', minHeight: 22, color: q?.ok ? 'var(--green)' : 'var(--danger)', fontWeight: 700 }} aria-live="polite">
        {q?.ok ? `${formatQty(q.quantityKg)} = ${money(q.totalCents / 100)}${q.savingsCents > 0 ? ` (−${money(q.savingsCents / 100)})` : ''}` : q?.error}
      </div>
      <button type="button" className={`btn ${compact ? 'btn-primary' : 'btn-green'}${added ? ' just-added' : ''}`} onClick={() => doAdd(false)} disabled={!q?.ok}>
        {added ? <><Check size={18} aria-hidden /> Ajouté au panier</> : <><ShoppingCart size={18} aria-hidden /> Ajouter au panier</>}
      </button>
      <button type="button" className={compact ? 'product-link-more' : 'btn btn-primary'} onClick={() => doAdd(true)} disabled={!q?.ok}>
        <Zap size={compact ? 14 : 16} aria-hidden /> Commander maintenant
      </button>
    </div>
  );
}
