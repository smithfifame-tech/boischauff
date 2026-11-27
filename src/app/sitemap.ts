import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/settings';
import { getProducts } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();
  const pages = ['', '/boutique', '/devis', '/suivi', '/a-propos', '/contact', '/faq', '/avis', '/cgv', '/confidentialite', '/livraison-retours']
    .map((p) => ({ url: `${base}${p}`, lastModified: now, changeFrequency: 'weekly' as const, priority: p === '' ? 1 : 0.7 }));
  let products: MetadataRoute.Sitemap = [];
  try {
    products = (await getProducts()).map((p) => ({ url: `${base}/produits/${p.slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 }));
  } catch { /* base indisponible : sitemap partiel */ }
  return [...pages, ...products];
}
