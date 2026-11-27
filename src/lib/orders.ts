import 'server-only';
import crypto from 'node:crypto';
import { z } from 'zod';
import { db, num, numOrNull, type Sql } from './db';
import { getProducts, getZones, mapZone } from './catalog';
import { getSettings } from './settings';
import { fromCents, quoteOrder, toCents, type Unit } from './pricing';
import { HttpError, randomToken, safeEqual } from './security';

// ------------------------------------------------------------------ statuts
export const ORDER_STATUSES = {
  awaiting_quote: 'Devis de livraison en cours',
  pending_payment: 'En attente de paiement',
  paid: 'Paiement confirmé',
  preparing: 'En préparation',
  shipping: 'En cours de livraison',
  delivered: 'Livrée',
  cancelled: 'Annulée',
} as const;
export type OrderStatus = keyof typeof ORDER_STATUSES;

export const PAYMENT_STATUSES = {
  unpaid: 'Non payée', pending: 'Paiement en attente', paid: 'Payée', failed: 'Paiement refusé', refunded: 'Remboursée',
} as const;

export const TRACKING_STEPS = [
  { key: 'received', label: 'Commande reçue' },
  { key: 'paid', label: 'Paiement confirmé' },
  { key: 'preparing', label: 'Commande en préparation' },
  { key: 'shipping', label: 'En cours de livraison' },
  { key: 'delivered', label: 'Livrée' },
] as const;

export function trackingStepIndex(status: string, paymentStatus: string): number {
  switch (status) {
    case 'delivered': return 4;
    case 'shipping': return 3;
    case 'preparing': return 2;
    case 'paid': return 1;
    default: return paymentStatus === 'paid' ? 1 : 0;
  }
}

// ------------------------------------------------------------------ numéros
function code(len = 5) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(len);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}
function datePart(d = new Date()) {
  return `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
}
export const newOrderNumbers = () => { const c = code(); const d = datePart(); return { order: `BC-${d}-${c}`, quote: `DV-${d}-${c}` }; };
export const newReceiptNumber = () => `RC-${datePart()}-${code(6)}`;
export const newTxPublicId = () => `TX${Date.now().toString(36).toUpperCase()}${code(6)}`;

// ------------------------------------------------------------------ validation
const phoneRe = /^[+0-9 ().-]{6,25}$/;
export const checkoutSchema = z.object({
  idempotencyKey: z.string().min(16).max(80),
  items: z.array(z.object({
    productId: z.number().int().positive(),
    quantity: z.number().positive().max(1_000_000),
    unit: z.enum(['kg', 't']),
  })).min(1, 'Votre panier est vide.').max(30),
  customer: z.object({
    firstName: z.string().trim().min(1, 'Prénom requis.').max(80),
    lastName: z.string().trim().min(1, 'Nom requis.').max(80),
    email: z.string().trim().toLowerCase().email('Adresse e-mail invalide.').max(160),
    phone: z.string().trim().regex(phoneRe, 'Numéro de téléphone invalide.'),
  }),
  address: z.object({
    line1: z.string().trim().min(3, 'Adresse requise.').max(200),
    line2: z.string().trim().max(200).optional().default(''),
    city: z.string().trim().min(2, 'Ville requise.').max(100),
    postalCode: z.string().trim().min(3, 'Code postal requis.').max(20),
    country: z.string().trim().min(2, 'Pays requis.').max(80),
  }).refine((a) => a.country !== 'France' || /^\d{5}$/.test(a.postalCode), { message: 'Code postal français : 5 chiffres.', path: ['postalCode'] }),
  zoneId: z.number().int().positive().nullable(),
  instructions: z.string().trim().max(1000).optional().default(''),
  desiredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  saveAddress: z.boolean().optional().default(false),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Veuillez accepter les conditions générales de vente.' }) }),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

// ------------------------------------------------------------------ chiffrage serveur
export async function computeQuote(items: { productId: number; quantity: number; unit: Unit }[], zoneId: number | null, sql: Sql = db()) {
  const [products, zones, settings] = await Promise.all([getProducts({}, sql), getZones({}, sql), getSettings()]);
  const zone = zoneId ? zones.find((z) => z.id === zoneId) ?? null : null;
  if (zoneId && !zone) throw new HttpError(422, 'Zone de livraison inconnue.');
  const quote = quoteOrder(products, items, zone, {
    taxRate: settings.commerce.tax_rate, minOrderAmount: settings.commerce.min_order_amount, currency: settings.commerce.currency,
  });
  return { quote, zone, products, settings };
}

// ------------------------------------------------------------------ création
export interface CreatedOrder { id: number; orderNumber: string; accessToken: string; status: OrderStatus; existing: boolean }

export async function createOrder(input: CheckoutInput, userId: number | null): Promise<CreatedOrder> {
  const settings = await getSettings();
  if (!userId && !settings.commerce.guest_checkout) {
    throw new HttpError(401, 'Veuillez créer un compte ou vous connecter pour commander.');
  }
  if (input.desiredDate) {
    const d = new Date(`${input.desiredDate}T00:00:00Z`);
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    if (Number.isNaN(d.getTime()) || d < today) throw new HttpError(422, 'La date de livraison souhaitée doit être dans le futur.');
  }

  return db().begin(async (sql) => {
    // Protection contre la double soumission du formulaire
    const dup = await sql<{ id: number; order_number: string; access_token: string; status: OrderStatus }[]>`
      select id, order_number, access_token, status from orders where idempotency_key = ${input.idempotencyKey}`;
    if (dup[0]) {
      return { id: Number(dup[0].id), orderNumber: dup[0].order_number, accessToken: dup[0].access_token, status: dup[0].status, existing: true };
    }

    const { quote, zone } = await computeQuote(input.items, input.zoneId, sql as unknown as Sql);
    if (!quote.ok) throw new HttpError(422, quote.errors[0], quote.errors);

    const numbers = newOrderNumbers();
    const accessToken = randomToken(24);
    const status: OrderStatus = quote.delivery.requiresQuote ? 'awaiting_quote' : 'pending_payment';
    const isDemo = quote.lines.length > 0 && (await sql<{ c: number }[]>`
      select count(*)::int as c from products where id in ${sql(quote.lines.map((l) => l.productId))} and is_demo_price`)[0].c > 0
      || Boolean(zone?.is_demo);

    const [order] = await sql<{ id: number }[]>`
      insert into orders (
        order_number, quote_number, access_token, idempotency_key, user_id, status, payment_status,
        customer_first_name, customer_last_name, customer_email, customer_phone,
        delivery_zone_id, delivery_zone_name, delivery_mode, delivery_instructions, desired_delivery_date,
        currency, wood_subtotal, volume_discount, delivery_fee, tax_rate, tax_amount, discount_amount, total_amount, is_demo
      ) values (
        ${numbers.order}, ${numbers.quote}, ${accessToken}, ${input.idempotencyKey}, ${userId}, ${status}, 'unpaid',
        ${input.customer.firstName}, ${input.customer.lastName}, ${input.customer.email}, ${input.customer.phone},
        ${zone?.id ?? null}, ${zone?.name ?? 'Autre localité (sur devis)'}, ${zone?.mode ?? 'quote'}, ${input.instructions}, ${input.desiredDate ?? null},
        ${settings.commerce.currency}, ${fromCents(quote.woodSubtotalCents)}, ${fromCents(quote.savingsCents)},
        ${quote.delivery.feeCents === null ? null : fromCents(quote.delivery.feeCents)},
        ${quote.taxRate}, ${fromCents(quote.taxCents)}, 0,
        ${quote.totalCents === null ? null : fromCents(quote.totalCents)}, ${isDemo}
      ) returning id`;
    const orderId = Number(order.id);

    for (const l of quote.lines) {
      await sql`
        insert into order_items (order_id, product_id, product_name, quantity, unit, quantity_kg, unit_price_kg, pricing_label, line_total, base_line_total)
        values (${orderId}, ${l.productId}, ${l.productName}, ${l.quantity}, ${l.unit}, ${l.quantityKg}, ${l.unitPriceKg},
                ${l.label}, ${fromCents(l.totalCents)}, ${fromCents(l.baseTotalCents)})`;
    }

    await sql`
      insert into addresses (order_id, kind, line1, line2, city, postal_code, country)
      values (${orderId}, 'delivery', ${input.address.line1}, ${input.address.line2}, ${input.address.city}, ${input.address.postalCode}, ${input.address.country})`;

    if (userId && input.saveAddress) {
      await sql`update addresses set is_default = false where user_id = ${userId}`;
      await sql`
        insert into addresses (user_id, kind, line1, line2, city, postal_code, country, is_default)
        values (${userId}, 'delivery', ${input.address.line1}, ${input.address.line2}, ${input.address.city}, ${input.address.postalCode}, ${input.address.country}, true)`;
    }

    await sql`insert into delivery_tracking (order_id, status, note) values (${orderId}, 'received',
      ${status === 'awaiting_quote' ? 'Commande reçue — frais de livraison en cours de calcul par notre équipe.' : 'Commande reçue — en attente de paiement.'})`;

    return { id: orderId, orderNumber: numbers.order, accessToken, status, existing: false };
  });
}

// ------------------------------------------------------------------ lecture
type Row = Record<string, unknown>;

export interface FullOrder {
  id: number; order_number: string; quote_number: string; access_token: string; user_id: number | null;
  status: OrderStatus; payment_status: keyof typeof PAYMENT_STATUSES;
  customer_first_name: string; customer_last_name: string; customer_email: string; customer_phone: string;
  delivery_zone_id: number | null; delivery_zone_name: string; delivery_mode: string; delivery_instructions: string;
  desired_delivery_date: string | null; currency: string;
  wood_subtotal: number; volume_discount: number; delivery_fee: number | null; tax_rate: number; tax_amount: number;
  discount_amount: number; total_amount: number | null; is_demo: boolean; internal_note: string;
  created_at: Date; updated_at: Date; paid_at: Date | null;
  items: { id: number; product_id: number | null; product_name: string; quantity: number; unit: string; quantity_kg: number; unit_price_kg: number; pricing_label: string; line_total: number; base_line_total: number }[];
  address: { line1: string; line2: string; city: string; postal_code: string; country: string } | null;
  tracking: { id: number; status: string; note: string; is_public: boolean; created_by: string; created_at: Date }[];
  payment: { provider: string; status: string; amount: number; currency: string; transaction_ref: string | null; method: string; is_demo: boolean; paid_at: Date | null } | null;
  transactions: { public_id: string; provider: string; provider_tx_id: string | null; status: string; amount: number; failure_reason: string; checkout_url: string | null; created_at: Date; updated_at: Date }[];
  receipt: { receipt_number: string; amount: number; currency: string; is_demo: boolean; issued_at: Date } | null;
}

function dateStr(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}

export async function getFullOrder(where: { id?: number; number?: string }, sql: Sql = db()): Promise<FullOrder | null> {
  const rows = where.id
    ? await sql<Row[]>`select * from orders where id = ${where.id}`
    : await sql<Row[]>`select * from orders where order_number = ${String(where.number || '').toUpperCase()}`;
  const o = rows[0];
  if (!o) return null;
  const id = Number(o.id);
  const [items, addr, tracking, payment, txs, receipt] = await Promise.all([
    sql<Row[]>`select * from order_items where order_id = ${id} order by id`,
    sql<Row[]>`select * from addresses where order_id = ${id} limit 1`,
    sql<Row[]>`select * from delivery_tracking where order_id = ${id} order by created_at, id`,
    sql<Row[]>`select * from payments where order_id = ${id} limit 1`,
    sql<Row[]>`select * from payment_transactions where order_id = ${id} order by created_at desc`,
    sql<Row[]>`select * from receipts where order_id = ${id} limit 1`,
  ]);
  return {
    id,
    order_number: String(o.order_number), quote_number: String(o.quote_number), access_token: String(o.access_token),
    user_id: o.user_id ? Number(o.user_id) : null,
    status: o.status as OrderStatus, payment_status: o.payment_status as FullOrder['payment_status'],
    customer_first_name: String(o.customer_first_name), customer_last_name: String(o.customer_last_name),
    customer_email: String(o.customer_email), customer_phone: String(o.customer_phone),
    delivery_zone_id: o.delivery_zone_id ? Number(o.delivery_zone_id) : null,
    delivery_zone_name: String(o.delivery_zone_name), delivery_mode: String(o.delivery_mode),
    delivery_instructions: String(o.delivery_instructions ?? ''), desired_delivery_date: dateStr(o.desired_delivery_date),
    currency: String(o.currency), wood_subtotal: num(o.wood_subtotal), volume_discount: num(o.volume_discount),
    delivery_fee: numOrNull(o.delivery_fee), tax_rate: num(o.tax_rate), tax_amount: num(o.tax_amount),
    discount_amount: num(o.discount_amount), total_amount: numOrNull(o.total_amount), is_demo: Boolean(o.is_demo),
    internal_note: String(o.internal_note ?? ''),
    created_at: o.created_at as Date, updated_at: o.updated_at as Date, paid_at: (o.paid_at as Date) ?? null,
    items: items.map((i) => ({
      id: Number(i.id), product_id: i.product_id ? Number(i.product_id) : null, product_name: String(i.product_name),
      quantity: num(i.quantity), unit: String(i.unit), quantity_kg: num(i.quantity_kg), unit_price_kg: num(i.unit_price_kg),
      pricing_label: String(i.pricing_label ?? ''), line_total: num(i.line_total), base_line_total: num(i.base_line_total),
    })),
    address: addr[0] ? {
      line1: String(addr[0].line1), line2: String(addr[0].line2 ?? ''), city: String(addr[0].city),
      postal_code: String(addr[0].postal_code ?? ''), country: String(addr[0].country),
    } : null,
    tracking: tracking.map((t) => ({
      id: Number(t.id), status: String(t.status), note: String(t.note ?? ''), is_public: Boolean(t.is_public),
      created_by: String(t.created_by ?? ''), created_at: t.created_at as Date,
    })),
    payment: payment[0] ? {
      provider: String(payment[0].provider), status: String(payment[0].status), amount: num(payment[0].amount),
      currency: String(payment[0].currency), transaction_ref: (payment[0].transaction_ref as string) ?? null,
      method: String(payment[0].method ?? ''), is_demo: Boolean(payment[0].is_demo), paid_at: (payment[0].paid_at as Date) ?? null,
    } : null,
    transactions: txs.map((t) => ({
      public_id: String(t.public_id), provider: String(t.provider), provider_tx_id: (t.provider_tx_id as string) ?? null,
      status: String(t.status), amount: num(t.amount), failure_reason: String(t.failure_reason ?? ''),
      checkout_url: (t.checkout_url as string) ?? null, created_at: t.created_at as Date, updated_at: t.updated_at as Date,
    })),
    receipt: receipt[0] ? {
      receipt_number: String(receipt[0].receipt_number), amount: num(receipt[0].amount), currency: String(receipt[0].currency),
      is_demo: Boolean(receipt[0].is_demo), issued_at: receipt[0].issued_at as Date,
    } : null,
  };
}

/** Accès client à une commande : jeton privé (lien e-mail), propriétaire connecté, ou administrateur. */
export function canAccessOrder(order: FullOrder, opts: { token?: string | null; userId?: number | null; isAdmin?: boolean }) {
  if (opts.isAdmin) return true;
  if (opts.userId && order.user_id === opts.userId) return true;
  if (opts.token && safeEqual(opts.token, order.access_token)) return true;
  return false;
}

export function digits(s: string) { return s.replace(/\D/g, ''); }

/** Vérification pour le suivi : e-mail exact ou 8 derniers chiffres du téléphone. */
export function matchesContact(order: FullOrder, contact: string) {
  const c = contact.trim().toLowerCase();
  if (!c) return false;
  if (c.includes('@')) return c === order.customer_email.toLowerCase();
  const a = digits(c), b = digits(order.customer_phone);
  return a.length >= 8 && b.length >= 8 && a.slice(-8) === b.slice(-8);
}

// ------------------------------------------------------------------ statut (admin)
export async function setOrderStatus(orderId: number, status: OrderStatus, note: string, by: string) {
  return db().begin(async (sql) => {
    const [o] = await sql<{ status: string; payment_status: string }[]>`select status, payment_status from orders where id = ${orderId} for update`;
    if (!o) throw new HttpError(404, 'Commande introuvable.');
    const needsPayment = ['preparing', 'shipping', 'delivered', 'paid'].includes(status);
    if (needsPayment && o.payment_status !== 'paid') {
      throw new HttpError(409, 'Impossible : le paiement de cette commande n\'est pas confirmé par la passerelle.');
    }
    if (status === 'pending_payment' && o.payment_status === 'paid') {
      throw new HttpError(409, 'Cette commande est déjà payée.');
    }
    await sql`update orders set status = ${status}, updated_at = now() where id = ${orderId}`;
    const map: Record<string, string> = { paid: 'paid', preparing: 'preparing', shipping: 'shipping', delivered: 'delivered', cancelled: 'cancelled', pending_payment: 'pending_payment', awaiting_quote: 'awaiting_quote' };
    await sql`insert into delivery_tracking (order_id, status, note, created_by) values (${orderId}, ${map[status]}, ${note}, ${by})`;
  });
}

/** L'administrateur chiffre la livraison d'une commande "sur devis" : le client peut ensuite payer. */
export async function setDeliveryFee(orderId: number, fee: number, by: string) {
  return db().begin(async (sql) => {
    const [o] = await sql<Row[]>`select * from orders where id = ${orderId} for update`;
    if (!o) throw new HttpError(404, 'Commande introuvable.');
    if (o.payment_status === 'paid') throw new HttpError(409, 'Commande déjà payée : frais non modifiables.');
    const wood = toCents(num(o.wood_subtotal));
    const feeC = toCents(fee);
    const tax = Math.round((wood + feeC) * num(o.tax_rate));
    const total = wood + feeC + tax;
    await sql`update orders set delivery_fee = ${fromCents(feeC)}, tax_amount = ${fromCents(tax)}, total_amount = ${fromCents(total)},
              status = 'pending_payment', updated_at = now() where id = ${orderId}`;
    await sql`insert into delivery_tracking (order_id, status, note, created_by)
              values (${orderId}, 'quote_ready', ${'Frais de livraison établis — vous pouvez régler votre commande.'}, ${by})`;
  });
}

export async function getZoneById(id: number) {
  const rows = await db()<Row[]>`select * from delivery_zones where id = ${id}`;
  return rows[0] ? mapZone(rows[0]) : null;
}
