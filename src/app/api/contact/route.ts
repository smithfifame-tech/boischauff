import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { apiRoute, clientIp, readJson } from '@/lib/security';
import { assertNotRateLimited, recordAttempt } from '@/lib/auth';
import { sendContactEmail } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

const schema = z.object({
  name: z.string().trim().min(2, 'Nom requis.').max(120),
  email: z.string().trim().email('E-mail invalide.').max(160),
  phone: z.string().trim().max(30).optional().default(''),
  subject: z.string().trim().max(160).optional().default(''),
  message: z.string().trim().min(10, 'Message trop court.').max(4000),
  website: z.string().max(0).optional().default(''), // pot de miel anti-robots
});

export const POST = apiRoute(async (req) => {
  const m = schema.parse(await readJson(req));
  const ip = clientIp(req);
  await assertNotRateLimited('track', `contact:${ip}`, ip);
  await recordAttempt('track', `contact:${ip}`, ip, false); // compte les envois (limite anti-spam)
  await db()`insert into contact_messages (name, email, phone, subject, message) values (${m.name}, ${m.email}, ${m.phone}, ${m.subject}, ${m.message})`;
  await sendContactEmail(m).catch(() => {});
  return NextResponse.json({ ok: true });
});
