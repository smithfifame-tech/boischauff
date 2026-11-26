import type { FullOrder } from '@/lib/orders';
import type { AllSettings } from '@/lib/settings';
import { formatMoney, formatQty } from '@/lib/pricing';

const fmt = (d: Date | string | null) => (d ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Paris' }) : '—');

export function OrderDoc({ o, s, kind = 'quote' }: { o: FullOrder; s: AllSettings; kind?: 'quote' | 'order' }) {
  const m = (v: number | null) => (v === null ? 'Sur devis' : formatMoney(v, o.currency, s.commerce.locale));
  return (
    <article className="doc">
      <div className="doc-head">
        <div>
          <small>{kind === 'quote' ? 'DEVIS' : 'COMMANDE'}</small>
          <h2>{kind === 'quote' ? `N° ${o.quote_number}` : `N° ${o.order_number}`}</h2>
          <div style={{ fontSize: '.9rem', opacity: .9 }}>Commande {o.order_number} · {fmt(o.created_at)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 900, fontFamily: 'var(--font-title)', fontSize: '1.15rem' }}>{s.company.name}</div>
          <div style={{ fontSize: '.85rem', opacity: .9 }}>{[s.company.phone, s.company.email].filter(Boolean).join(' · ')}</div>
        </div>
      </div>
      <div className="doc-body">
        {o.is_demo && s.commerce.show_demo_notice && <p className="alert alert-warn" style={{ marginBottom: 16 }}>Document établi avec des prix ou frais de démonstration.</p>}
        <dl className="kv" style={{ marginBottom: 18 }}>
          <dt>Client</dt><dd>{o.customer_first_name} {o.customer_last_name}</dd>
          <dt>Contact</dt><dd>{o.customer_email} · {o.customer_phone}</dd>
          <dt>Livraison</dt><dd>{o.address ? `${o.address.line1}${o.address.line2 ? `, ${o.address.line2}` : ''}, ${`${o.address.postal_code} ${o.address.city}`.trim()}, ${o.address.country}` : '—'}<br /><span className="hint">Zone : {o.delivery_zone_name}{o.desired_delivery_date ? ` · souhaitée le ${new Date(o.desired_delivery_date).toLocaleDateString('fr-FR')}` : ''}</span></dd>
          {o.delivery_instructions && <><dt>Instructions</dt><dd style={{ fontWeight: 600 }}>{o.delivery_instructions}</dd></>}
        </dl>
        <div style={{ overflowX: 'auto' }}>
          <table className="doc-table">
            <thead><tr><th>Produit</th><th>Quantité</th><th className="r">Prix unitaire</th><th className="r">Prix du bois</th></tr></thead>
            <tbody>
              {o.items.map((i) => (
                <tr key={i.id}>
                  <td><strong>{i.product_name}</strong><br /><span className="hint">{i.pricing_label}</span></td>
                  <td>{formatQty(i.quantity_kg)}{i.unit === 't' ? <span className="hint"> ({i.quantity.toLocaleString('fr-FR')} t)</span> : null}</td>
                  <td className="r">{m(i.unit_price_kg)}/kg</td>
                  <td className="r"><strong>{m(i.line_total)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="summary" style={{ maxWidth: 380, marginLeft: 'auto', marginTop: 16 }}>
          <div className="summary-row"><span>Prix du bois</span><strong>{m(o.wood_subtotal)}</strong></div>
          <div className="summary-row"><span>Réduction (tarif dégressif)</span><strong className={o.volume_discount > 0 ? 'saving' : ''}>{o.volume_discount > 0 ? `- ${m(o.volume_discount)} (incluse)` : m(0)}</strong></div>
          <div className="summary-row"><span>Frais de livraison</span><strong>{o.delivery_fee === 0 ? 'Offerts' : m(o.delivery_fee)}</strong></div>
          <div className="summary-row"><span>{s.commerce.tax_label}{o.tax_rate > 0 ? ` (${(o.tax_rate * 100).toLocaleString('fr-FR')} %)` : ''}</span><strong>{o.tax_amount > 0 ? m(o.tax_amount) : 'Non applicable'}</strong></div>
          {o.discount_amount > 0 && <div className="summary-row"><span>Réduction</span><strong>- {m(o.discount_amount)}</strong></div>}
          <div className="summary-row summary-total"><span style={{ color: 'var(--ink)', fontWeight: 800 }}>Montant total</span><strong>{m(o.total_amount)}</strong></div>
        </div>
      </div>
    </article>
  );
}
