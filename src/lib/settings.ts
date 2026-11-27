import 'server-only';
import { cache } from 'react';
import { db } from './db';

export interface CompanySettings {
  name: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  delivery_area: string;
  logo_url: string;
  primary_color: string;
  primary_dark: string;
  accent_color: string;
  gold_color: string;
  opening_hours: string;
  social: { facebook: string; whatsapp: string; youtube: string; tiktok: string; instagram: string };
}
export interface CommerceSettings {
  currency: string;
  locale: string;
  tax_rate: number;
  tax_label: string;
  min_order_amount: number;
  guest_checkout: boolean;
  show_demo_notice: boolean;
}
export interface ReceiptSettings { footer: string; legal_mentions: string }
export interface NotificationSettings { order_email: string }

export interface AllSettings {
  company: CompanySettings;
  commerce: CommerceSettings;
  receipt: ReceiptSettings;
  notifications: NotificationSettings;
}

export const DEFAULT_SETTINGS: AllSettings = {
  company: {
    name: 'GodenWood',
    tagline: 'Chauffez naturellement, vivez mieux',
    phone: '',
    email: '',
    address: '',
    delivery_area: '',
    logo_url: '',
    primary_color: '#1E140C',
    primary_dark: '#0E0906',
    accent_color: '#F5A623',
    gold_color: '#FFC542',
    opening_hours: '',
    social: { facebook: '', whatsapp: '', youtube: '', tiktok: '', instagram: '' },
  },
  commerce: {
    currency: 'EUR',
    locale: 'fr-FR',
    tax_rate: 0,
    tax_label: 'TVA',
    min_order_amount: 50,
    guest_checkout: false,
    show_demo_notice: true,
  },
  receipt: { footer: 'Merci pour votre confiance.', legal_mentions: '' },
  notifications: { order_email: '' },
};

function merge<T>(base: T, over: unknown): T {
  if (!over || typeof over !== 'object') return base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(over as Record<string, unknown>)) {
    const b = (base as Record<string, unknown>)[k];
    if (b && typeof b === 'object' && !Array.isArray(b) && v && typeof v === 'object') out[k] = merge(b, v);
    else if (v !== undefined && v !== null) out[k] = v;
  }
  return out as T;
}

export const getSettings = cache(async (): Promise<AllSettings> => {
  try {
    const rows = await db()<{ key: string; value: unknown }[]>`select key, value from settings`;
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return {
      company: merge(DEFAULT_SETTINGS.company, map.company),
      commerce: merge(DEFAULT_SETTINGS.commerce, map.commerce),
      receipt: merge(DEFAULT_SETTINGS.receipt, map.receipt),
      notifications: merge(DEFAULT_SETTINGS.notifications, map.notifications),
    };
  } catch (e) {
    console.error('[settings] lecture impossible', (e as Error).message);
    return DEFAULT_SETTINGS;
  }
});

export async function saveSetting(key: keyof AllSettings, value: unknown) {
  await db()`
    insert into settings (key, value, updated_at) values (${key}, ${db().json(value as never)}, now())
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
}

/** Adresse e-mail qui reçoit les nouvelles commandes. */
export function orderInbox(s: AllSettings): string {
  return s.notifications.order_email || process.env.ORDER_NOTIFICATION_EMAIL || s.company.email;
}

export function siteUrl(): string {
  const explicit = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}
