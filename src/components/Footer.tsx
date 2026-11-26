import Link from 'next/link';
import { Mail, MapPin, Phone, ShieldCheck, Heart } from 'lucide-react';
import { Brand } from './Logo';
import { SocialIcons } from './SocialIcons';
import type { AllSettings } from '@/lib/settings';
import { img, PHOTOS } from '@/lib/img';

export function Footer({ s, paymentMode }: { s: AllSettings; paymentMode: string }) {
  const c = s.company;
  const year = new Date().getFullYear();
  return (
    <footer className="footer" style={{ ['--footer-img' as string]: `url(${img(PHOTOS.fireplaceLogs, 1600, 700, 50)})` }}>
      <div className="container footer-main">
        <div>
          <Brand name={c.name} tagline={c.tagline} logoUrl={c.logo_url} size={56} />
          <p style={{ marginTop: 16, fontSize: '.95rem', color: '#CFE0D3' }}>
            Bois de chauffage sélectionné, séché et livré chez vous. Commandez en ligne en quelques clics.
          </p>
          <div className="secure-badge"><ShieldCheck size={26} aria-hidden /><span>Paiement sécurisé<small>{paymentMode === 'stripe' ? 'Carte bancaire · Stripe' : 'Transactions chiffrées'}</small></span></div>
        </div>
        <div>
          <h4>Liens utiles</h4>
          <ul>
            <li><Link href="/">Accueil</Link></li>
            <li><Link href="/boutique">Boutique</Link></li>
            <li><Link href="/devis">Commander / devis</Link></li>
            <li><Link href="/suivi">Suivi de commande</Link></li>
            <li><Link href="/compte">Mon compte</Link></li>
          </ul>
        </div>
        <div>
          <h4>Informations</h4>
          <ul>
            <li><Link href="/a-propos">À propos</Link></li>
            <li><Link href="/livraison-retours">Livraison & retours</Link></li>
            <li><Link href="/faq">FAQ</Link></li>
            <li><Link href="/cgv">Conditions générales de vente</Link></li>
            <li><Link href="/confidentialite">Confidentialité</Link></li>
          </ul>
        </div>
        <div>
          <h4>Contactez-nous</h4>
          <ul className="footer-contact">
            {c.phone && <li><Phone size={17} aria-hidden /><a href={`tel:${c.phone.replace(/[^+\d]/g, '')}`}>{c.phone}</a></li>}
            {c.email && <li><Mail size={17} aria-hidden /><a href={`mailto:${c.email}`} style={{ wordBreak: 'break-all' }}>{c.email}</a></li>}
            {(c.address || c.delivery_area) && <li><MapPin size={17} aria-hidden /><span>{c.address || c.delivery_area}</span></li>}
          </ul>
        </div>
        <div>
          <h4>Suivez-nous</h4>
          <SocialIcons social={c.social} phone={c.phone} />
          {c.opening_hours && <p style={{ marginTop: 14, fontSize: '.9rem' }}>{c.opening_hours}</p>}
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <span>© {year} {c.name}. Tous droits réservés.</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>Un service fiable, rapide et sécurisé <Heart size={14} fill="#F47A08" color="#F47A08" aria-hidden /></span>
        </div>
      </div>
    </footer>
  );
}
