import { ZonesManager } from '@/components/admin/ZonesManager';
import { getZones } from '@/lib/catalog';
import { getSettings } from '@/lib/settings';

export default async function AdminDelivery() {
  const [zones, s] = await Promise.all([getZones({ includeInactive: true }), getSettings()]);
  return (
    <>
      <div className="admin-head"><h1>Livraison</h1></div>
      <p className="hint" style={{ marginTop: -10 }}>Modes : <strong>gratuit</strong>, <strong>tarif fixe</strong>, <strong>selon la distance</strong> (fixe + €/km × distance) ou <strong>sur devis</strong> (chiffrage manuel avant paiement). Le seuil « offerte dès » s&apos;applique au montant du bois.</p>
      <ZonesManager zones={zones.map((z) => ({ ...z }))} currency={s.commerce.currency} />
    </>
  );
}
