import { z } from 'zod';

export const zoneSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(300).default(''),
  mode: z.enum(['free', 'fixed', 'distance', 'quote']),
  fixed_fee: z.number().min(0).max(1_000_000).default(0),
  per_km_fee: z.number().min(0).max(100_000).default(0),
  distance_km: z.number().min(0).max(100_000).default(0),
  free_above: z.number().min(0).max(100_000_000).nullable().default(null),
  min_order_amount: z.number().min(0).max(100_000_000).nullable().default(null),
  lead_time: z.string().trim().max(80).default(''),
  is_active: z.boolean().default(true),
  is_demo: z.boolean().default(false),
  sort_order: z.number().int().min(0).max(10000).default(0),
});
export type ZoneInput = z.infer<typeof zoneSchema>;
