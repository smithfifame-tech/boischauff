import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRoute, readJson } from '@/lib/security';
import { requireAdmin } from '@/lib/auth';
import { saveSetting } from '@/lib/settings';

export const dynamic = 'force-dynamic';

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Couleur au format #RRGGBB.');
const url = z.string().trim().max(500).refine((v) => v === '' || /^https:\/\//.test(v), 'Lien https requis.');
const schema = z.object({
  company: z.object({
    name: z.string().trim().min(2).max(80), tagline: z.string().trim().max(120), phone: z.string().trim().max(40),
    email: z.string().trim().max(160).refine((v) => v === '' || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), 'E-mail invalide.'),
    address: z.string().trim().max(300), delivery_area: z.string().trim().max(160), logo_url: url,
    primary_color: color, primary_dark: color, accent_color: color, gold_color: color, opening_hours: z.string().trim().max(200),
    social: z.object({ facebook: url, whatsapp: z.string().trim().max(500), youtube: url, tiktok: url, instagram: url }),
  }),
  commerce: z.object({
    currency: z.string().trim().regex(/^[A-Z]{3}$/, 'Code devise ISO (ex. EUR, XOF).'), locale: z.string().trim().max(10),
    tax_rate: z.number().min(0).max(1), tax_label: z.string().trim().max(20), min_order_amount: z.number().min(0).max(1_000_000),
    guest_checkout: z.boolean(), show_demo_notice: z.boolean(),
  }),
  receipt: z.object({ footer: z.string().trim().max(500), legal_mentions: z.string().trim().max(1000) }),
  notifications: z.object({ order_email: z.string().trim().email('E-mail de réception invalide.') }),
});

export const PUT = apiRoute(async (req) => {
  await requireAdmin();
  const s = schema.parse(await readJson(req));
  await saveSetting('company', s.company);
  await saveSetting('commerce', s.commerce);
  await saveSetting('receipt', s.receipt);
  await saveSetting('notifications', s.notifications);
  return NextResponse.json({ ok: true });
});
