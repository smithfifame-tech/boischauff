import Link from 'next/link';
import { ArrowDown, ArrowRight, BadgeCheck, Calculator, CheckCircle2, CreditCard, Handshake, Headset, Leaf, PackageCheck, ShieldCheck, Truck } from 'lucide-react';
import { QuoteCalculator } from '@/components/QuoteCalculator';
import { ProductCard } from '@/components/ProductCard';
import { getProducts } from '@/lib/catalog';
import { getSettings } from '@/lib/settings';
import { activeProvider } from '@/lib/payments';
import { formatMoney } from '@/lib/pricing';
import { img, PHOTOS, srcSet } from '@/lib/img';

export default async function HomePage() {
  const [s, products] = await Promise.all([getSettings(), getProducts()]);
  const { currency, locale, min_order_amount } = s.commerce;
  const featured = (products.filter((p) => p.is_featured).length >= 4 ? products.filter((p) => p.is_featured) : products).slice(0, 4);
  const showDemo = s.commerce.show_demo_notice;
  const provider = activeProvider();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: s.company.name,
    description: 'Vente et livraison de bois de chauffage',
    telephone: s.company.phone || undefined,
    email: s.company.email || undefined,
    areaServed: s.company.delivery_area || undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="hero">
        <div className="hero-bg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img(PHOTOS.hero, 1600, 900, 70)} srcSet={srcSet(PHOTOS.hero, [800, 1200, 1600, 2200], 16 / 9)} sizes="100vw"
            alt="Bois de chauffage empilé prêt à être livré" fetchPriority="high" width={1600} height={900} />
        </div>
        <div className="container">
          <div>
            <span className="chip fade-up"><Leaf size={16} aria-hidden /> Bois de chauffage de qualité</span>
            <h1 className="fade-up d1">Votre bois de chauffage <span className="accent">au meilleur prix !</span></h1>
            <p className="hero-sub fade-up d2">Commandez en ligne, payez en toute sécurité et recevez votre bois directement chez vous.</p>
            <div className="hero-actions fade-up d3">
              <Link href="/devis" className="btn btn-primary btn-lg">Commander maintenant <ArrowRight size={19} aria-hidden /></Link>
              <Link href="/boutique" className="btn btn-outline-light btn-lg">Découvrir nos bois <ArrowDown size={19} aria-hidden /></Link>
            </div>
          </div>
          <div className="fade-up d2"><QuoteCalculator /></div>
        </div>
      </section>

      <section className="trust" aria-label="Nos engagements">
        <div className="container">
          <div className="trust-item"><ShieldCheck size={34} aria-hidden /><span>Paiement sécurisé<small>{provider === 'saspay' ? 'SasPay — Mobile Money' : 'Vérifié côté serveur'}</small></span></div>
          <div className="trust-item"><Truck size={34} aria-hidden /><span>Livraison rapide<small>{s.company.delivery_area || 'À domicile'}</small></span></div>
          <div className="trust-item"><Headset size={34} aria-hidden /><span>Service client<small>À votre écoute</small></span></div>
          <div className="trust-item"><BadgeCheck size={34} aria-hidden /><span>Qualité garantie<small>Bois sélectionné & séché</small></span></div>
          <div className="trust-item"><Handshake size={34} aria-hidden /><span>Satisfaction client<small>Accompagnement personnalisé</small></span></div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-title"><h2>Nos bois de chauffage</h2><p>Des essences sélectionnées, séchées et prêtes à brûler. Choisissez la quantité exacte qu&apos;il vous faut, du sac de 50 kg à plusieurs tonnes.</p></div>
          <div className="products-layout">
            {featured.map((p) => <ProductCard key={p.id} p={p} currency={currency} locale={locale} showDemo={showDemo} />)}
            <aside className="promo-card">
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>À partir de</div>
                <div className="big">{formatMoney(min_order_amount, currency, locale).replace(/,00/, '')}</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', marginTop: 6 }}>et jusqu&apos;à</div>
                <div style={{ color: 'var(--gold)', fontWeight: 900, fontSize: '1.5rem', fontFamily: 'var(--font-title)' }}>{formatMoney(1000, currency, locale).replace(/,00/, '')} et plus !</div>
                <div className="script">Commandez selon vos besoins !</div>
              </div>
              <Link href="/devis" className="btn btn-primary" style={{ marginTop: 18 }}>Calculer mon devis</Link>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img(PHOTOS.stack, 400, 300)} alt="" loading="lazy" aria-hidden />
            </aside>
          </div>
          <div style={{ textAlign: 'center', marginTop: 30 }}>
            <Link href="/boutique" className="btn btn-green">Voir toute la boutique <ArrowRight size={18} aria-hidden /></Link>
          </div>
        </div>
      </section>

      <section className="section section-beige">
        <div className="container">
          <div className="section-title"><h2>Commander en 4 étapes</h2><p>Un parcours simple, un prix calculé instantanément et un paiement 100 % sécurisé.</p></div>
          <div className="steps">
            {[
              { i: <Calculator size={22} />, t: 'Choisissez votre bois', d: 'Sélectionnez l\'essence et la quantité en kg ou en tonnes : le prix s\'affiche en temps réel.' },
              { i: <Truck size={22} />, t: 'Indiquez la livraison', d: 'Renseignez votre adresse et votre zone. Les frais sont calculés ou chiffrés par notre équipe.' },
              { i: <CreditCard size={22} />, t: 'Payez en ligne', d: 'Réglez en toute sécurité. Votre commande n\'est validée qu\'après confirmation réelle du paiement.' },
              { i: <PackageCheck size={22} />, t: 'Recevez votre bois', d: 'Reçu PDF par e-mail, suivi en ligne et livraison à la date convenue.' },
            ].map((st, n) => (
              <div className="step" key={st.t}>
                <div className="step-num">{n + 1}</div>
                <h3>{st.t}</h3>
                <p>{st.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div className="split-media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img(PHOTOS.truck, 900, 675)} srcSet={srcSet(PHOTOS.truck, [500, 900, 1300], 4 / 3)} sizes="(max-width: 1020px) 100vw, 50vw"
              alt="Camion chargé de bois prêt pour la livraison" loading="lazy" width={900} height={675} />
            <div className="split-badge">Livraison à domicile</div>
          </div>
          <div>
            <span className="chip" style={{ background: 'var(--beige)', color: 'var(--green)', borderColor: 'var(--line)' }}><Truck size={16} aria-hidden /> Préparation & livraison</span>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', marginTop: 14 }}>Nous préparons et livrons votre bois</h2>
            <p style={{ color: 'var(--muted)' }}>De la sélection en forêt jusqu&apos;à votre porte, nous maîtrisons chaque étape pour vous garantir un bois sec, propre et prêt à l&apos;emploi.</p>
            <ul className="check-list">
              <li><CheckCircle2 size={20} aria-hidden /> Bois séché pour une combustion efficace et peu de fumée</li>
              <li><CheckCircle2 size={20} aria-hidden /> Quantités sur mesure, du particulier au professionnel</li>
              <li><CheckCircle2 size={20} aria-hidden /> Tarifs dégressifs automatiques sur les gros volumes</li>
              <li><CheckCircle2 size={20} aria-hidden /> Suivi de commande en ligne à chaque étape</li>
            </ul>
            <Link href="/a-propos" className="btn btn-green">En savoir plus <ArrowRight size={18} aria-hidden /></Link>
          </div>
        </div>
      </section>

      <section className="section-sm">
        <div className="container">
          <div className="cta-band">
            <div>
              <h2>Besoin d&apos;un grand volume ?</h2>
              <p>Calculez votre devis en 30 secondes, ou contactez-nous pour une livraison sur mesure.</p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/devis" className="btn btn-lg">Calculer mon devis</Link>
              <Link href="/contact" className="btn btn-outline-light btn-lg">Nous contacter</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
