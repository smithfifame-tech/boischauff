import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRoute, readJson } from '@/lib/security';
import { computeQuote } from '@/lib/orders';
import { fromCents } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

const schema = z.object({
  items: z.array(z.object({ productId: z.number().int().positive(), quantity: z.number().positive().max(1_000_000), unit: z.enum(['kg', 't']) })).max(30),
  zoneId: z.number().int().positive().nullable(),
});

/** Chiffrage faisant foi, calculé côté serveur à partir des prix en base. */
export const POST = apiRoute(async (req) => {
  const body = schema.parse(await readJson(req));
  const { quote, zone, settings } = await computeQuote(body.items, body.zoneId);
  return NextResponse.json({
    ok: quote.ok,
    errors: quote.errors,
    currency: settings.commerce.currency,
    lines: quote.lines.map((l) => ({
      productId: l.productId, productName: l.productName, quantity: l.quantity, unit: l.unit, quantityKg: l.quantityKg,
      unitPriceKg: l.unitPriceKg, label: l.label, total: fromCents(l.totalCents), baseTotal: fromCents(l.baseTotalCents), ok: l.ok, error: l.error,
    })),
    woodSubtotal: fromCents(quote.woodSubtotalCents),
    savings: fromCents(quote.savingsCents),
    delivery: { requiresQuote: quote.delivery.requiresQuote, fee: quote.delivery.feeCents === null ? null : fromCents(quote.delivery.feeCents), label: quote.delivery.label, zone: zone?.name ?? null },
    taxRate: quote.taxRate,
    tax: fromCents(quote.taxCents),
    total: quote.totalCents === null ? null : fromCents(quote.totalCents),
  });
});
