import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { apiRoute, readJson } from '@/lib/security';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const schema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(30).optional().default(''),
  address: z.object({
    line1: z.string().trim().min(3).max(200),
    line2: z.string().trim().max(200).optional().default(''),
    city: z.string().trim().min(2).max(100),
    postalCode: z.string().trim().max(20).optional().default(''),
    country: z.string().trim().min(2).max(80),
  }).nullable().optional(),
});

export const PUT = apiRoute(async (req) => {
  const user = await requireUser();
  const b = schema.parse(await readJson(req));
  await db().begin(async (sql) => {
    await sql`update users set first_name = ${b.firstName}, last_name = ${b.lastName}, phone = ${b.phone}, updated_at = now() where id = ${user.id}`;
    if (b.address) {
      await sql`delete from addresses where user_id = ${user.id} and order_id is null`;
      await sql`insert into addresses (user_id, kind, line1, line2, city, postal_code, country, is_default)
                values (${user.id}, 'delivery', ${b.address.line1}, ${b.address.line2}, ${b.address.city}, ${b.address.postalCode}, ${b.address.country}, true)`;
    }
  });
  return NextResponse.json({ ok: true });
});
