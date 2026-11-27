import Link from 'next/link';
import { Flame, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { Newsletter } from './Newsletter';
import { telHref } from '@/lib/phone';
import { Brand } from './Logo';
import type { AllSettings } from '@/lib/settings';
import { img, PHOTOS } from '@/lib/img';

export function Footer({ s, paymentMode }: { s: AllSettings; paymentMode: string }) {
  const c = s.company;
  const year = new Date().getFullYear();
  return (
    <>
    <Newsletter social={c.social} phone={c.phone} />
    <footer className="footer" style={{ ['--footer-img' as string]: `url(${img(PHOTOS.fireplaceLogs, 1600, 700, 50)})` }}>
      <div className="container footer-main">
        <div>
          <Brand name={c.name} tagline={c.tagline} logoUrl={c.logo_url} size={56} />
          <p style={{ marginTop: 16, fontSize: '.95rem', color: '#CDBDA5' }}>
            Bois de chauffage premium, sélectionné, séché et livré partout en France.
          </p>
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
            <li><Link href="/avis">Avis clients</Link></li>
            <li><Link href="/cgv">Conditions générales de vente</Link></li>
            <li><Link href="/confidentialite">Confidentialité</Link></li>
          </ul>
        </div>
        <div>
          <h4>Contactez-nous</h4>
          <ul className="footer-contact">
            {c.phone && <li><Phone size={17} aria-hidden /><a href={telHref(c.phone)}>{c.phone}</a></li>}
            {c.email && <li><Mail size={17} aria-hidden /><a href={`mailto:${c.email}`} style={{ wordBreak: 'break-all' }}>{c.email}</a></li>}
            {(c.address || c.delivery_area) && <li><MapPin size={17} aria-hidden /><span>{c.address || c.delivery_area}</span></li>}
          </ul>
        </div>
        <div>
          <div className="pay-card">
            <div className="top"><ShieldCheck size={34} aria-hidden /><span>Paiement sécurisé<br /><small style={{ fontWeight: 600, opacity: .85 }}>{paymentMode === 'saspay' ? 'avec SasPay' : paymentMode === 'stripe' ? 'par carte bancaire avec Stripe' : 'transactions chiffrées'}</small></span></div>
            <div className="methods" aria-label="Moyens de paiement acceptés">{paymentMode === 'saspay' ? <><span>SasPay</span><span>Paiement en ligne sécurisé</span></> : <><span>CB</span><span>VISA</span><span>Mastercard</span><span>Apple Pay</span><span>Google Pay</span></>}</div>
          </div>
          {c.opening_hours && <p style={{ marginTop: 14, fontSize: '.9rem' }}>{c.opening_hours}</p>}
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <span>© {year} {c.name}. Tous droits réservés.</span>
          <span>Bois de chauffage en France 🇫🇷</span>
          <em style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>Ensemble, pour un hiver chaleureux et responsable <Flame size={15} color="#F5A623" aria-hidden /></em>
        </div>
      </div>
    </footer>
    </>
  );
}
