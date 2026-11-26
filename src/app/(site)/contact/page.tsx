import { img, PHOTOS } from '@/lib/img';
import type { Metadata } from 'next';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { PageHero } from '@/components/PageHero';
import { ContactForm } from '@/components/ContactForm';
import { getSettings } from '@/lib/settings';

export const metadata: Metadata = { title: 'Contact', description: 'Contactez-nous pour une commande, un devis sur mesure ou une question sur la livraison.', alternates: { canonical: '/contact' } };

export default async function ContactPage() {
  const c = (await getSettings()).company;
  return (
    <>
      <PageHero image={PHOTOS.axeLog} title="Contact" intro="Une question, un grand volume, une livraison particulière ? Écrivez-nous, nous répondons rapidement." />
      <section className="section">
        <div className="container contact-grid">
          <div style={{ display: 'grid', gap: 14, alignContent: 'start' }} data-reveal="left">
            <div className="img-banner" style={{ height: 200, marginBottom: 4 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img(PHOTOS.livingFire, 700, 400)} alt="Salon chauffé au feu de bois" loading="lazy" />
              <span className="label">Réponse rapide, du lundi au samedi</span>
            </div>
            {c.phone && <a className="info-card" href={`tel:${c.phone.replace(/[^+\d]/g, '')}`}><Phone size={26} aria-hidden /><div><strong>Téléphone</strong><br />{c.phone}</div></a>}
            {c.email && <a className="info-card" href={`mailto:${c.email}`}><Mail size={26} aria-hidden /><div><strong>E-mail</strong><br /><span style={{ wordBreak: 'break-all' }}>{c.email}</span></div></a>}
            {(c.address || c.delivery_area) && <div className="info-card"><MapPin size={26} aria-hidden /><div><strong>{c.address ? 'Adresse' : 'Zone de livraison'}</strong><br />{c.address || c.delivery_area}</div></div>}
            {c.opening_hours && <div className="info-card"><Clock size={26} aria-hidden /><div><strong>Horaires</strong><br />{c.opening_hours}</div></div>}
          </div>
          <div data-reveal="right"><ContactForm /></div>
        </div>
      </section>
    </>
  );
}
