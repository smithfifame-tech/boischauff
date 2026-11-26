'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/client';
import type { CartItem } from './SiteProvider';

export interface ServerQuote {
  ok: boolean; errors: string[]; currency: string;
  lines: { productId: number; productName: string; quantity: number; unit: string; quantityKg: number; unitPriceKg: number; label: string; total: number; baseTotal: number; ok: boolean; error?: string }[];
  woodSubtotal: number; savings: number;
  delivery: { requiresQuote: boolean; fee: number | null; label: string; zone: string | null };
  taxRate: number; tax: number; total: number | null;
}

/** Chiffrage serveur (source de vérité) recalculé à chaque modification du panier ou de la zone. */
export function useServerQuote(items: CartItem[], zoneId: number | null, enabled = true) {
  const [quote, setQuote] = useState<ServerQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const key = JSON.stringify({ items, zoneId });
  useEffect(() => {
    if (!enabled) return;
    if (!items.length) { setQuote(null); return; }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(() => {
      api<ServerQuote>('/api/quote', { body: { items, zoneId } })
        .then((q) => { if (!cancelled) { setQuote(q); setError(''); } })
        .catch((e: Error) => { if (!cancelled) setError(e.message); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);
  return { quote, loading, error };
}
