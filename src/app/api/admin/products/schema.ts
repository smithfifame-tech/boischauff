import { z } from 'zod';

export const productSchema = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Identifiant d\'URL invalide (lettres, chiffres, tirets).').max(80),
  name: z.string().trim().min(2).max(120),
  short_description: z.string().trim().max(200).default(''),
  description: z.string().trim().max(5000).default(''),
  species: z.string().trim().max(200).default(''),
  drying_level: z.string().trim().max(200).default(''),
  moisture: z.string().trim().max(60).default(''),
  recommended_use: z.string().trim().max(300).default(''),
  features: z.array(z.string().trim().min(1).max(120)).max(12).default([]),
  base_price_per_kg: z.number().min(0).max(100000),
  sale_unit: z.string().trim().max(20).default('kg'),
  allowed_units: z.array(z.enum(['kg', 't'])).min(1),
  min_qty_kg: z.number().positive().max(1_000_000),
  max_qty_kg: z.number().positive().max(10_000_000).nullable(),
  stock_kg: z.number().min(0).max(100_000_000).nullable(),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  is_demo_price: z.boolean(),
  badge: z.string().trim().max(40).default(''),
  sort_order: z.number().int().min(0).max(10000).default(0),
  images: z.array(z.object({ url: z.string().trim().url('URL d\'image invalide.').max(1000).refine((u) => u.startsWith('https://'), 'L\'image doit être en https.'), alt: z.string().trim().max(200).default('') })).max(8).default([]),
  rules: z.array(z.object({
    rule_type: z.enum(['tier', 'pack']),
    label: z.string().trim().max(80).default(''),
    min_qty_kg: z.number().positive().nullable().default(null),
    price_per_kg: z.number().min(0).nullable().default(null),
    pack_qty_kg: z.number().positive().nullable().default(null),
    pack_price: z.number().min(0).nullable().default(null),
  }).superRefine((r, ctx) => {
    if (r.rule_type === 'tier' && (r.min_qty_kg === null || r.price_per_kg === null)) ctx.addIssue({ code: 'custom', message: 'Palier : quantité minimum et prix au kg requis.' });
    if (r.rule_type === 'pack' && (r.pack_qty_kg === null || r.pack_price === null)) ctx.addIssue({ code: 'custom', message: 'Forfait : quantité et prix requis.' });
  })).max(20).default([]),
}).refine((p) => p.max_qty_kg === null || p.max_qty_kg >= p.min_qty_kg, { message: 'La quantité maximum doit être supérieure au minimum.' });

export type ProductInput = z.infer<typeof productSchema>;
