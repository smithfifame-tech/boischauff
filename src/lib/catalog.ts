import 'server-only';
import { db, num, numOrNull, type Sql } from './db';
import type { DeliveryZone, PricedProduct, PriceRule } from './pricing';

export interface ProductImage { id: number; url: string; alt: string; credit: string; sort_order: number }

export interface Product extends PricedProduct {
  slug: string;
  short_description: string;
  description: string;
  species: string;
  drying_level: string;
  moisture: string;
  recommended_use: string;
  features: string[];
  sale_unit: string;
  qty_step_kg: number;
  is_active: boolean;
  is_featured: boolean;
  is_demo_price: boolean;
  badge: string;
  sort_order: number;
  images: ProductImage[];
}

export interface Zone extends DeliveryZone {
  description: string;
  lead_time: string;
  postal_prefixes: string;
  is_active: boolean;
  is_demo: boolean;
  sort_order: number;
}

type Row = Record<string, unknown>;

function mapRule(r: Row): PriceRule & { id: number; is_active: boolean } {
  return {
    id: Number(r.id),
    rule_type: r.rule_type as 'tier' | 'pack',
    label: String(r.label ?? ''),
    min_qty_kg: numOrNull(r.min_qty_kg),
    price_per_kg: numOrNull(r.price_per_kg),
    pack_qty_kg: numOrNull(r.pack_qty_kg),
    pack_price: numOrNull(r.pack_price),
    is_active: Boolean(r.is_active),
  };
}

function mapProduct(p: Row, rules: Row[], images: Row[]): Product {
  return {
    id: Number(p.id),
    slug: String(p.slug),
    name: String(p.name),
    short_description: String(p.short_description ?? ''),
    description: String(p.description ?? ''),
    species: String(p.species ?? ''),
    drying_level: String(p.drying_level ?? ''),
    moisture: String(p.moisture ?? ''),
    recommended_use: String(p.recommended_use ?? ''),
    features: Array.isArray(p.features) ? (p.features as string[]) : [],
    base_price_per_kg: num(p.base_price_per_kg),
    sale_unit: String(p.sale_unit ?? 'kg'),
    allowed_units: (p.allowed_units as string[]) ?? ['kg', 't'],
    min_qty_kg: num(p.min_qty_kg),
    max_qty_kg: numOrNull(p.max_qty_kg),
    qty_step_kg: num(p.qty_step_kg) || 1,
    stock_kg: numOrNull(p.stock_kg),
    is_active: Boolean(p.is_active),
    is_featured: Boolean(p.is_featured),
    is_demo_price: Boolean(p.is_demo_price),
    badge: String(p.badge ?? ''),
    sort_order: Number(p.sort_order ?? 0),
    rules: rules.filter((r) => Number(r.product_id) === Number(p.id)).map(mapRule),
    images: images
      .filter((i) => Number(i.product_id) === Number(p.id))
      .map((i) => ({ id: Number(i.id), url: String(i.url), alt: String(i.alt ?? ''), credit: String(i.credit ?? ''), sort_order: Number(i.sort_order ?? 0) })),
  };
}

export async function getProducts(opts: { includeInactive?: boolean } = {}, sql: Sql = db()): Promise<Product[]> {
  const products = opts.includeInactive
    ? await sql<Row[]>`select * from products order by sort_order, id`
    : await sql<Row[]>`select * from products where is_active order by sort_order, id`;
  if (products.length === 0) return [];
  const ids = products.map((p) => Number(p.id));
  const [rules, images] = await Promise.all([
    sql<Row[]>`select * from price_rules where product_id = any(${ids}) order by rule_type, min_qty_kg nulls last, pack_qty_kg nulls last`,
    sql<Row[]>`select * from product_images where product_id = any(${ids}) order by sort_order, id`,
  ]);
  return products.map((p) => mapProduct(p, rules, images));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const rows = await db()<Row[]>`select * from products where slug = ${slug} and is_active limit 1`;
  if (!rows[0]) return null;
  const id = Number(rows[0].id);
  const [rules, images] = await Promise.all([
    db()<Row[]>`select * from price_rules where product_id = ${id} order by rule_type, min_qty_kg nulls last`,
    db()<Row[]>`select * from product_images where product_id = ${id} order by sort_order, id`,
  ]);
  return mapProduct(rows[0], rules, images);
}

export async function getProductById(id: number): Promise<Product | null> {
  const rows = await db()<Row[]>`select * from products where id = ${id} limit 1`;
  if (!rows[0]) return null;
  const [rules, images] = await Promise.all([
    db()<Row[]>`select * from price_rules where product_id = ${id} order by rule_type, min_qty_kg nulls last`,
    db()<Row[]>`select * from product_images where product_id = ${id} order by sort_order, id`,
  ]);
  return mapProduct(rows[0], rules, images);
}

export function mapZone(z: Row): Zone {
  return {
    id: Number(z.id),
    name: String(z.name),
    description: String(z.description ?? ''),
    mode: z.mode as Zone['mode'],
    fixed_fee: num(z.fixed_fee),
    per_km_fee: num(z.per_km_fee),
    distance_km: num(z.distance_km),
    free_above: numOrNull(z.free_above),
    min_order_amount: numOrNull(z.min_order_amount),
    lead_time: String(z.lead_time ?? ''),
    postal_prefixes: String(z.postal_prefixes ?? ''),
    is_active: Boolean(z.is_active),
    is_demo: Boolean(z.is_demo),
    sort_order: Number(z.sort_order ?? 0),
  };
}

export async function getZones(opts: { includeInactive?: boolean } = {}, sql: Sql = db()): Promise<Zone[]> {
  const rows = opts.includeInactive
    ? await sql<Row[]>`select * from delivery_zones order by sort_order, id`
    : await sql<Row[]>`select * from delivery_zones where is_active order by sort_order, id`;
  return rows.map(mapZone);
}

/** Version sérialisable envoyée au navigateur pour l'aperçu du calculateur. */
export function publicProduct(p: Product) {
  return {
    id: p.id, slug: p.slug, name: p.name, short_description: p.short_description,
    base_price_per_kg: p.base_price_per_kg, min_qty_kg: p.min_qty_kg, max_qty_kg: p.max_qty_kg,
    qty_step_kg: p.qty_step_kg, stock_kg: p.stock_kg, allowed_units: p.allowed_units, is_active: p.is_active,
    is_demo_price: p.is_demo_price, image: p.images[0]?.url ?? '', image_alt: p.images[0]?.alt ?? p.name,
    rules: p.rules.filter((r) => r.is_active !== false),
  };
}
export type PublicProduct = ReturnType<typeof publicProduct>;

export function publicZone(z: Zone) {
  return {
    id: z.id, name: z.name, description: z.description, mode: z.mode, fixed_fee: z.fixed_fee,
    per_km_fee: z.per_km_fee, distance_km: z.distance_km, free_above: z.free_above,
    min_order_amount: z.min_order_amount, lead_time: z.lead_time, is_demo: z.is_demo, postal_prefixes: z.postal_prefixes,
  };
}
export type PublicZone = ReturnType<typeof publicZone>;
