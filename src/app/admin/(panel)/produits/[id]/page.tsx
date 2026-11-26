import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ProductForm, type ProductFormValue } from '@/components/admin/ProductForm';
import { getProductById } from '@/lib/catalog';
import { getSettings } from '@/lib/settings';

type Props = { params: Promise<{ id: string }> };

export default async function AdminProduct({ params }: Props) {
  const { id } = await params;
  const s = await getSettings();
  let value: ProductFormValue | null = null;
  if (id !== 'nouveau') {
    const p = await getProductById(Number(id));
    if (!p) notFound();
    value = {
      id: p.id, slug: p.slug, name: p.name, short_description: p.short_description, description: p.description, species: p.species,
      drying_level: p.drying_level, moisture: p.moisture, recommended_use: p.recommended_use, features: p.features,
      base_price_per_kg: p.base_price_per_kg, sale_unit: p.sale_unit, allowed_units: p.allowed_units as ('kg' | 't')[],
      min_qty_kg: p.min_qty_kg, max_qty_kg: p.max_qty_kg, stock_kg: p.stock_kg, is_active: p.is_active, is_featured: p.is_featured,
      is_demo_price: p.is_demo_price, badge: p.badge, sort_order: p.sort_order,
      images: p.images.map((i) => ({ url: i.url, alt: i.alt })),
      rules: p.rules.map((r) => ({ rule_type: r.rule_type, label: r.label, min_qty_kg: r.min_qty_kg, price_per_kg: r.price_per_kg, pack_qty_kg: r.pack_qty_kg, pack_price: r.pack_price })),
    };
  }
  return (
    <>
      <div className="admin-head"><div><Link href="/admin/produits" className="hint" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><ArrowLeft size={16} /> Produits</Link><h1>{value ? value.name : 'Nouveau produit'}</h1></div></div>
      <ProductForm value={value} currency={s.commerce.currency} />
    </>
  );
}
