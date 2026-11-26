import { BadgeCheck, CreditCard, Flame, Leaf, Percent, Truck } from 'lucide-react';

const ITEMS = [
  { icon: Truck, text: 'Livraison partout en France et en Europe' },
  { icon: Flame, text: 'Bois sec, prêt à brûler' },
  { icon: Percent, text: 'Tarifs dégressifs automatiques' },
  { icon: CreditCard, text: 'Paiement sécurisé par carte' },
  { icon: Leaf, text: 'Essences sélectionnées' },
  { icon: BadgeCheck, text: 'Reçu et suivi en ligne' },
];

export function Marquee() {
  const list = [...ITEMS, ...ITEMS];
  return (
    <div className="marquee" aria-label="Nos engagements">
      <div className="marquee-track">
        {list.map(({ icon: Icon, text }, i) => (
          <span className="marquee-item" key={i} aria-hidden={i >= ITEMS.length ? true : undefined}><Icon size={20} aria-hidden /> {text}</span>
        ))}
      </div>
    </div>
  );
}
