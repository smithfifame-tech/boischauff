import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiRoute, HttpError, readJson } from '@/lib/security';
import { requireAdmin } from '@/lib/auth';
import { zoneSchema } from '../schema';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };

export const PUT = apiRoute<Ctx>(async (req, ctx) => {
  await requireAdmin();
  const id = Number((await ctx.params).id);
  const z = zoneSchema.parse(await readJson(req));
  const r = await db()`update delivery_zones set name=${z.name}, description=${z.description}, mode=${z.mode}, fixed_fee=${z.fixed_fee},
    per_km_fee=${z.per_km_fee}, distance_km=${z.distance_km}, free_above=${z.free_above}, min_order_amount=${z.min_order_amount},
    lead_time=${z.lead_time}, is_active=${z.is_active}, is_demo=${z.is_demo}, sort_order=${z.sort_order}, updated_at=now() where id=${id} returning id`;
  if (!r.length) throw new HttpError(404, 'Zone introuvable.');
  return NextResponse.json({ ok: true });
});

export const DELETE = apiRoute<Ctx>(async (_req, ctx) => {
  await requireAdmin();
  const id = Number((await ctx.params).id);
  const used = await db()`select 1 from orders where delivery_zone_id = ${id} limit 1`;
  if (used.length) {
    await db()`update delivery_zones set is_active = false, updated_at = now() where id = ${id}`;
    return NextResponse.json({ ok: true, archived: true });
  }
  await db()`delete from delivery_zones where id = ${id}`;
  return NextResponse.json({ ok: true, archived: false });
});
