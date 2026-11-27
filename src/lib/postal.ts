/** Choix automatique de la zone de livraison à partir du code postal (et du pays). */
export interface PostalZone { id: number; postal_prefixes?: string }

export function zoneForPostal<Z extends PostalZone>(zones: Z[], postalCode: string, country = 'France'): Z | null {
  const code = postalCode.replace(/\s/g, '');
  const inFrance = !country || country === 'France';
  const parsed = zones.map((z) => ({ z, list: (z.postal_prefixes || '').split(',').map((s) => s.trim().toUpperCase()).filter(Boolean) }));
  if (!inFrance) return parsed.find((p) => p.list.includes('EU'))?.z ?? null;
  if (!/^\d{5}$/.test(code)) return null;
  // Le préfixe le plus long l'emporte (ex. 75 avant FR).
  let best: { z: Z; len: number } | null = null;
  for (const p of parsed) for (const pre of p.list) {
    if (/^\d+$/.test(pre) && code.startsWith(pre) && (!best || pre.length > best.len)) best = { z: p.z, len: pre.length };
  }
  if (best) return best.z;
  // Corse (20xxx) et outre-mer (97/98) : pas de zone automatique, le client choisit (ou demande un devis).
  if (/^(20|97|98)/.test(code)) return null;
  return parsed.find((p) => p.list.includes('FR'))?.z ?? null;
}
