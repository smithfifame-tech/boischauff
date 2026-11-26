import { Info } from 'lucide-react';

export function DemoNotice({ demoPrices, paymentMode }: { demoPrices: boolean; paymentMode: string }) {
  if (!demoPrices && paymentMode !== 'demo') return null;
  const parts: string[] = [];
  if (demoPrices) parts.push('les prix et frais de livraison affichés sont des valeurs de démonstration');
  if (paymentMode === 'demo') parts.push('le paiement fonctionne en mode démonstration (aucun encaissement réel)');
  return (
    <div className="demo-notice" role="note">
      <div className="container"><Info size={16} aria-hidden /><span><strong>Site en configuration :</strong> {parts.join(' et ')}.</span></div>
    </div>
  );
}
