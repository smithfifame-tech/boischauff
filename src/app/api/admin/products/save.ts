import 'server-only';
import { db } from '@/lib/db';
import { HttpError } from '@/lib/security';
import type { ProductInput } from './schema';

/** Tableau texte Postgres ({kg,t}) : valeurs déjà validées (énumération). */
const pgTextArray = (a: string[]) => `{${a.map((x) => `"${x.replace(/["\\]/g, '')}"`).join(',')}}`;

export async function saveProduct(p: ProductInput, id: number | null): Promise<number> {
  return db().begin(async (sql) => {
    const clash = await sql`select id from products where slug = ${p.slug} and id <> ${id ?? 0}`;
    if (clash.length) throw new HttpError(409, 'Un autre produit utilise déjà cet identifiant d\'URL.');
    let pid = id;
    if (pid) {
      const r = await sql`update products set slug=${p.slug}, name=${p.name}, short_description=${p.short_description}, description=${p.description},
        species=${p.species}, drying_level=${p.drying_level}, moisture=${p.moisture}, recommended_use=${p.recommended_use},
        features=${sql.json(p.features)}, base_price_per_kg=${p.base_price_per_kg}, sale_unit=${p.sale_unit}, allowed_units=${pgTextArray(p.allowed_units)}::text[],
        min_qty_kg=${p.min_qty_kg}, max_qty_kg=${p.max_qty_kg}, stock_kg=${p.stock_kg}, is_active=${p.is_active}, is_featured=${p.is_featured},
        is_demo_price=${p.is_demo_price}, badge=${p.badge}, sort_order=${p.sort_order}, updated_at=now()
        where id = ${pid} returning id`;
      if (!r.length) throw new HttpError(404, 'Produit introuvable.');
    } else {
      const [r] = await sql<{ id: number }[]>`insert into products (slug, name, short_description, description, species, drying_level, moisture,
        recommended_use, features, base_price_per_kg, sale_unit, allowed_units, min_qty_kg, max_qty_kg, stock_kg, is_active, is_featured,
        is_demo_price, badge, sort_order) values (${p.slug}, ${p.name}, ${p.short_description}, ${p.description}, ${p.species}, ${p.drying_level},
        ${p.moisture}, ${p.recommended_use}, ${sql.json(p.features)}, ${p.base_price_per_kg}, ${p.sale_unit}, ${pgTextArray(p.allowed_units)}::text[], ${p.min_qty_kg},
        ${p.max_qty_kg}, ${p.stock_kg}, ${p.is_active}, ${p.is_featured}, ${p.is_demo_price}, ${p.badge}, ${p.sort_order}) returning id`;
      pid = Number(r.id);
    }
    await sql`delete from product_images where product_id = ${pid}`;
    let i = 0;
    for (const img of p.images) {
      await sql`insert into product_images (product_id, url, alt, sort_order) values (${pid}, ${img.url}, ${img.alt || p.name}, ${i++})`;
    }
    await sql`delete from price_rules where product_id = ${pid}`;
    for (const r of p.rules) {
      await sql`insert into price_rules (product_id, rule_type, label, min_qty_kg, price_per_kg, pack_qty_kg, pack_price)
        values (${pid}, ${r.rule_type}, ${r.label}, ${r.rule_type === 'tier' ? r.min_qty_kg : null}, ${r.rule_type === 'tier' ? r.price_per_kg : null},
                ${r.rule_type === 'pack' ? r.pack_qty_kg : null}, ${r.rule_type === 'pack' ? r.pack_price : null})`;
    }
    return pid as number;
  });
}
