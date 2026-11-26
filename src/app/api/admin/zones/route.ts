import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiRoute, readJson } from '@/lib/security';
import { requireAdmin } from '@/lib/auth';
import { zoneSchema } from './schema';

export const dynamic = 'force-dynamic';

export const POST = apiRoute(async (req) => {
  await requireAdmin();
  const z = zoneSchema.parse(await readJson(req));
  const [r] = await db()<{ id: number }[]>`insert into delivery_zones (name, description, mode, fixed_fee, per_km_fee, distance_km, free_above,
    min_order_amount, lead_time, is_active, is_demo, sort_order) values (${z.name}, ${z.description}, ${z.mode}, ${z.fixed_fee}, ${z.per_km_fee},
    ${z.distance_km}, ${z.free_above}, ${z.min_order_amount}, ${z.lead_time}, ${z.is_active}, ${z.is_demo}, ${z.sort_order}) returning id`;
  return NextResponse.json({ ok: true, id: Number(r.id) });
});
