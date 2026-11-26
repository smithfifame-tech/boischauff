// Moteur de prix partagé (navigateur pour l'aperçu, serveur pour le calcul faisant foi).
// Tous les montants sont calculés en centimes pour éviter les erreurs d'arrondi.

export type Unit = 'kg' | 't';

export interface PriceRule {
  id?: number;
  rule_type: 'tier' | 'pack';
  label: string;
  min_qty_kg: number | null;
  price_per_kg: number | null;
  pack_qty_kg: number | null;
  pack_price: number | null;
  is_active?: boolean;
}

export interface PricedProduct {
  id: number;
  name: string;
  base_price_per_kg: number;
  min_qty_kg: number;
  max_qty_kg: number | null;
  qty_step_kg?: number;
  stock_kg: number | null;
  allowed_units: string[];
  is_active?: boolean;
  rules: PriceRule[];
}

export interface DeliveryZone {
  id: number;
  name: string;
  mode: 'free' | 'fixed' | 'distance' | 'quote';
  fixed_fee: number;
  per_km_fee: number;
  distance_km: number;
  free_above: number | null;
  min_order_amount: number | null;
  is_demo?: boolean;
}

export const toCents = (v: number) => Math.round(v * 100);
export const fromCents = (c: number) => Math.round(c) / 100;

export function toKg(quantity: number, unit: Unit): number {
  const kg = unit === 't' ? quantity * 1000 : quantity;
  return Math.round(kg * 1000) / 1000;
}

export function formatQty(kg: number): string {
  if (kg >= 1000) {
    const t = kg / 1000;
    return `${t.toLocaleString('fr-FR', { maximumFractionDigits: 3 })} t`;
  }
  return `${kg.toLocaleString('fr-FR', { maximumFractionDigits: 3 })} kg`;
}

export interface LineQuote {
  ok: boolean;
  error?: string;
  quantityKg: number;
  unitPriceKg: number;      // prix au kg appliqué
  basePriceKg: number;
  label: string;            // tarif appliqué
  totalCents: number;       // montant du bois
  baseTotalCents: number;   // montant sans dégressivité
  savingsCents: number;
}

/** Calcule le prix d'une quantité pour un produit selon ses règles. */
export function quoteLine(product: PricedProduct, quantity: number, unit: Unit): LineQuote {
  const quantityKg = toKg(quantity, unit);
  const base = product.base_price_per_kg;
  const empty: LineQuote = {
    ok: false, quantityKg, unitPriceKg: base, basePriceKg: base, label: '',
    totalCents: 0, baseTotalCents: 0, savingsCents: 0,
  };
  if (!Number.isFinite(quantity) || quantity <= 0) return { ...empty, error: 'Quantité invalide.' };
  if (!product.allowed_units.includes(unit)) return { ...empty, error: 'Unité non disponible pour ce produit.' };
  if (product.is_active === false) return { ...empty, error: 'Produit indisponible.' };
  if (quantityKg < product.min_qty_kg) {
    return { ...empty, error: `Quantité minimum : ${formatQty(product.min_qty_kg)}.` };
  }
  if (product.max_qty_kg !== null && quantityKg > product.max_qty_kg) {
    return { ...empty, error: `Quantité maximum : ${formatQty(product.max_qty_kg)}. Contactez-nous pour un volume supérieur.` };
  }
  if (product.stock_kg !== null && quantityKg > product.stock_kg) {
    return { ...empty, error: `Stock disponible : ${formatQty(product.stock_kg)}.` };
  }

  const baseTotalCents = Math.round(quantityKg * base * 100);
  const rules = product.rules.filter((r) => r.is_active !== false);

  // 1) Forfait exact (ex. sac de 50 kg)
  const pack = rules.find(
    (r) => r.rule_type === 'pack' && r.pack_qty_kg !== null && Math.abs(r.pack_qty_kg - quantityKg) < 0.0005,
  );
  if (pack && pack.pack_price !== null) {
    const totalCents = toCents(pack.pack_price);
    return {
      ok: true, quantityKg, basePriceKg: base,
      unitPriceKg: Math.round((pack.pack_price / quantityKg) * 10000) / 10000,
      label: pack.label || `Forfait ${formatQty(quantityKg)}`,
      totalCents, baseTotalCents, savingsCents: Math.max(0, baseTotalCents - totalCents),
    };
  }

  // 2) Palier dégressif : le palier le plus élevé atteint
  const tier = rules
    .filter((r) => r.rule_type === 'tier' && r.min_qty_kg !== null && r.price_per_kg !== null && quantityKg >= (r.min_qty_kg as number))
    .sort((a, b) => (b.min_qty_kg as number) - (a.min_qty_kg as number))[0];

  const unitPriceKg = tier ? (tier.price_per_kg as number) : base;
  const totalCents = Math.round(quantityKg * unitPriceKg * 100);
  return {
    ok: true, quantityKg, basePriceKg: base, unitPriceKg,
    label: tier ? tier.label : 'Prix de base au kg',
    totalCents, baseTotalCents, savingsCents: Math.max(0, baseTotalCents - totalCents),
  };
}

export interface DeliveryQuote {
  requiresQuote: boolean;
  feeCents: number | null;
  label: string;
}

export function quoteDelivery(zone: DeliveryZone | null, woodSubtotalCents: number): DeliveryQuote {
  if (!zone) return { requiresQuote: true, feeCents: null, label: 'Livraison sur devis' };
  if (zone.mode === 'quote') return { requiresQuote: true, feeCents: null, label: 'Livraison sur devis' };
  if (zone.free_above !== null && woodSubtotalCents >= toCents(zone.free_above)) {
    return { requiresQuote: false, feeCents: 0, label: 'Livraison offerte' };
  }
  switch (zone.mode) {
    case 'free':
      return { requiresQuote: false, feeCents: 0, label: 'Gratuit' };
    case 'fixed':
      return { requiresQuote: false, feeCents: toCents(zone.fixed_fee), label: 'Tarif fixe' };
    case 'distance': {
      const fee = zone.fixed_fee + zone.per_km_fee * zone.distance_km;
      return { requiresQuote: false, feeCents: toCents(fee), label: `Selon distance (${zone.distance_km} km)` };
    }
    default:
      return { requiresQuote: true, feeCents: null, label: 'Livraison sur devis' };
  }
}

export interface CartLineInput { productId: number; quantity: number; unit: Unit }

export interface OrderQuote {
  ok: boolean;
  errors: string[];
  lines: (LineQuote & { productId: number; productName: string; quantity: number; unit: Unit })[];
  woodSubtotalCents: number;
  savingsCents: number;
  delivery: DeliveryQuote;
  taxRate: number;
  taxCents: number;
  totalCents: number | null;   // null si livraison sur devis
  minOrderCents: number;
}

export function quoteOrder(
  products: PricedProduct[],
  items: CartLineInput[],
  zone: DeliveryZone | null,
  opts: { taxRate: number; minOrderAmount: number; currency?: string },
): OrderQuote {
  const errors: string[] = [];
  const lines: OrderQuote['lines'] = [];
  for (const it of items) {
    const p = products.find((x) => x.id === it.productId);
    if (!p) { errors.push('Un produit du panier n\'est plus disponible.'); continue; }
    const q = quoteLine(p, it.quantity, it.unit);
    if (!q.ok) errors.push(`${p.name} : ${q.error}`);
    lines.push({ ...q, productId: p.id, productName: p.name, quantity: it.quantity, unit: it.unit });
  }
  if (items.length === 0) errors.push('Votre panier est vide.');
  const woodSubtotalCents = lines.reduce((s, l) => s + (l.ok ? l.totalCents : 0), 0);
  const savingsCents = lines.reduce((s, l) => s + (l.ok ? l.savingsCents : 0), 0);
  const minOrderCents = toCents(opts.minOrderAmount || 0);
  if (items.length > 0 && woodSubtotalCents < minOrderCents) {
    errors.push(`Montant minimum de commande : ${formatCents(minOrderCents, opts.currency)} de bois.`);
  }
  if (zone && zone.min_order_amount !== null && woodSubtotalCents < toCents(zone.min_order_amount)) {
    errors.push(`Commande minimum pour la zone ${zone.name} : ${formatMoney(zone.min_order_amount, opts.currency)}.`);
  }
  const delivery = quoteDelivery(zone, woodSubtotalCents);
  const taxRate = opts.taxRate || 0;
  const taxable = woodSubtotalCents + (delivery.feeCents ?? 0);
  const taxCents = Math.round(taxable * taxRate);
  const totalCents = delivery.requiresQuote ? null : woodSubtotalCents + (delivery.feeCents ?? 0) + taxCents;
  return { ok: errors.length === 0, errors, lines, woodSubtotalCents, savingsCents, delivery, taxRate, taxCents, totalCents, minOrderCents };
}

export function formatMoney(amount: number, currency = 'EUR', locale = 'fr-FR'): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: currency === 'XOF' ? 0 : 2 }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
export const formatCents = (c: number, currency = 'EUR', locale = 'fr-FR') => formatMoney(fromCents(c), currency, locale);
