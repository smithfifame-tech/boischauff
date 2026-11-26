import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getProducts } from '@/lib/catalog';
import { getSettings } from '@/lib/settings';
import { formatMoney, formatQty } from '@/lib/pricing';
import { img } from '@/lib/img';

export default async function AdminProducts() {
  const [products, s] = await Promise.all([getProducts({ includeInactive: true }), getSettings()]);
  return (
    <>
      <div className="admin-head"><h1>Produits</h1><Link href="/admin/produits/nouveau" className="btn btn-primary btn-sm"><Plus size={16} /> Ajouter un produit</Link></div>
      {products.some((p) => p.is_demo_price) && <p className="alert alert-warn" style={{ marginBottom: 14 }}>Certains prix sont marqués « démonstration ». Vérifiez-les puis décochez l&apos;option « Prix de démonstration » pour les valider.</p>}
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th></th><th>Produit</th><th>Prix / kg</th><th>Min – max</th><th>Stock</th><th>Règles</th><th>État</th></tr></thead>
          <tbody>{products.map((p) => (
            <tr key={p.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <td style={{ width: 70 }}>{p.images[0] && <img src={img(p.images[0].url, 120, 90)} alt="" style={{ width: 60, height: 45, objectFit: 'cover', borderRadius: 6 }} />}</td>
              <td><Link className="row-link" href={`/admin/produits/${p.id}`}>{p.name}</Link><br /><span className="hint">/{p.slug}</span></td>
              <td>{formatMoney(p.base_price_per_kg, s.commerce.currency, s.commerce.locale)} {p.is_demo_price && <span className="demo-tag">démo</span>}</td>
              <td>{formatQty(p.min_qty_kg)} – {p.max_qty_kg ? formatQty(p.max_qty_kg) : '∞'}</td>
              <td>{p.stock_kg === null ? 'Non suivi' : formatQty(p.stock_kg)}</td>
              <td>{p.rules.length}</td>
              <td><span className={`badge ${p.is_active ? 'b-green' : 'b-grey'}`}>{p.is_active ? 'Actif' : 'Inactif'}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </>
  );
}
