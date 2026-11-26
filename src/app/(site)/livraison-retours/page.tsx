import type { Metadata } from 'next';
import { LegalPage, ToComplete } from '@/components/LegalPage';
import { getZones } from '@/lib/catalog';
import { getSettings } from '@/lib/settings';
import { formatMoney, quoteDelivery } from '@/lib/pricing';

export const metadata: Metadata = { title: 'Politique de livraison et de retour', alternates: { canonical: '/livraison-retours' } };

export default async function ShippingPage() {
  const [zones, s] = await Promise.all([getZones(), getSettings()]);
  const m = (v: number) => formatMoney(v, s.commerce.currency, s.commerce.locale);
  return (
    <LegalPage title="Livraison & retours" intro={s.company.delivery_area}>
      <h2>Préparation et livraison</h2>
      <p>Chaque commande est préparée par notre équipe après confirmation du paiement, puis livrée à l&apos;adresse indiquée. Vous êtes informé(e) à chaque étape par e-mail et sur la page de suivi.</p>
      <h2>Zones et frais</h2>
      <table className="tier-table">
        <thead><tr><th>Zone</th><th>Délai indicatif</th><th>Frais</th></tr></thead>
        <tbody>{zones.map((z) => { const d = quoteDelivery(z, 0); return (
          <tr key={z.id}><td>{z.name}{z.is_demo && s.commerce.show_demo_notice ? ' (démo)' : ''}</td><td>{z.lead_time || '—'}</td>
            <td>{d.requiresQuote ? 'Sur devis' : d.feeCents === 0 ? 'Gratuit' : m((d.feeCents ?? 0) / 100)}{z.free_above !== null ? ` — offerte dès ${m(z.free_above)}` : ''}</td></tr>); })}</tbody>
      </table>
      <p>Lorsque la zone n&apos;est pas configurée, les frais sont calculés manuellement et communiqués <strong>avant le paiement</strong>.</p>
      <h2>Réception</h2>
      <p>Merci de vérifier la quantité et l&apos;état du bois à la livraison et de signaler toute anomalie au livreur ou par e-mail dans un délai de <ToComplete>délai</ToComplete>.</p>
      <h2>Retours et remboursements</h2>
      <p>Le bois étant un produit en vrac, les retours sont étudiés au cas par cas en cas de non-conformité avérée. Les remboursements éventuels sont effectués via le moyen de paiement utilisé. <ToComplete>conditions précises de l&apos;entreprise</ToComplete></p>
    </LegalPage>
  );
}
