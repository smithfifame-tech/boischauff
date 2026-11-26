import type { Metadata } from 'next';
import { CheckCircle2 } from 'lucide-react';
import { PageHero } from '@/components/PageHero';
import { QuoteCalculator } from '@/components/QuoteCalculator';
import { getProducts, getZones } from '@/lib/catalog';
import { getSettings } from '@/lib/settings';
import { formatMoney, formatQty, quoteDelivery } from '@/lib/pricing';

export const metadata: Metadata = { title: 'Calculateur de devis', description: 'Calculez instantanément le prix de votre bois de chauffage selon la quantité (kg ou tonnes) et votre zone de livraison.', alternates: { canonical: '/devis' } };

type Props = { searchParams: Promise<{ produit?: string }> };

export default async function QuotePage({ searchParams }: Props) {
  const [products, zones, s] = await Promise.all([getProducts(), getZones(), getSettings()]);
  const sp = await searchParams;
  const initial = Number(sp.produit) || undefined;
  const m = (v: number) => formatMoney(v, s.commerce.currency, s.commerce.locale);
  return (
    <>
      <PageHero title="Calculateur de devis" intro="Choisissez votre bois, la quantité en kilogrammes ou en tonnes et votre zone : le devis s'affiche instantanément, sans rechargement." />
      <section className="section">
        <div className="container two-col">
          <div>
            <div className="card card-pad">
              <h2 style={{ fontSize: '1.3rem' }}>Comment le prix est-il calculé ?</h2>
              <p style={{ color: 'var(--muted)' }}><strong>Prix du bois = quantité en kg × prix du kilogramme.</strong> Les tonnes sont converties automatiquement (1 t = 1 000 kg). Plus vous commandez, plus le prix au kilo baisse grâce aux tarifs dégressifs.</p>
              <ul className="check-list">
                <li><CheckCircle2 size={20} aria-hidden /> Commande minimum : {m(s.commerce.min_order_amount)} de bois</li>
                <li><CheckCircle2 size={20} aria-hidden /> Montant vérifié côté serveur avant tout paiement</li>
                <li><CheckCircle2 size={20} aria-hidden /> Devis imprimable avant paiement</li>
              </ul>
            </div>
            <div className="card card-pad" style={{ marginTop: 20 }}>
              <h2 style={{ fontSize: '1.2rem' }}>Zones de livraison</h2>
              <div className="table-wrap" style={{ border: 0 }}>
                <table className="tier-table">
                  <thead><tr><th>Zone</th><th>Délai</th><th>Frais</th></tr></thead>
                  <tbody>
                    {zones.map((z) => { const d = quoteDelivery(z, 0); return (
                      <tr key={z.id}>
                        <td><strong>{z.name}</strong>{z.is_demo && s.commerce.show_demo_notice ? <> <span className="demo-tag">démo</span></> : null}<br /><span className="hint">{z.description}</span></td>
                        <td>{z.lead_time || '—'}</td>
                        <td>{d.requiresQuote ? 'Sur devis' : d.feeCents === 0 ? 'Gratuit' : m((d.feeCents ?? 0) / 100)}{z.free_above !== null ? <><br /><span className="hint">offerte dès {m(z.free_above)}</span></> : null}</td>
                      </tr>
                    ); })}
                  </tbody>
                </table>
              </div>
              <p className="hint" style={{ marginTop: 10, marginBottom: 0 }}>Zone non listée ? Choisissez « sur devis » : nos frais vous sont communiqués avant tout paiement.</p>
            </div>
            <div className="card card-pad" style={{ marginTop: 20 }}>
              <h2 style={{ fontSize: '1.2rem' }}>Tarifs au kilogramme</h2>
              <table className="tier-table">
                <thead><tr><th>Bois</th><th>Minimum</th><th>Prix / kg</th></tr></thead>
                <tbody>{products.map((p) => <tr key={p.id}><td>{p.name}</td><td>{formatQty(p.min_qty_kg)}</td><td>{m(p.base_price_per_kg)}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
          <div className="sticky"><QuoteCalculator variant="full" initialProductId={initial} /></div>
        </div>
      </section>
    </>
  );
}
