import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { apiRoute, HttpError, readJson } from '@/lib/security';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
const schema = z.object({ status: z.enum(['approved', 'rejected', 'pending']) });

export const PATCH = apiRoute<{ params: Promise<{ id: string }> }>(async (req, ctx) => {
  await requireAdmin();
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Identifiant invalide.');
  const { status } = schema.parse(await readJson(req));
  const r = await db()`update reviews set status = ${status}, moderated_at = now() where id = ${id} returning id`;
  if (!r.length) throw new HttpError(404, 'Avis introuvable.');
  return NextResponse.json({ ok: true });
});

export const DELETE = apiRoute<{ params: Promise<{ id: string }> }>(async (_req, ctx) => {
  await requireAdmin();
  const id = Number((await ctx.params).id);
  await db()`delete from reviews where id = ${id}`;
  return NextResponse.json({ ok: true });
});
