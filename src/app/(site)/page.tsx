import Link from 'next/link';
import { ArrowDown, ArrowRight, BadgeCheck, Calculator, CheckCircle2, CreditCard, Flame, Handshake, Headset, Leaf, PackageCheck, ShieldCheck, Truck } from 'lucide-react';
import { QuoteCalculator } from '@/components/QuoteCalculator';
import { ProductCard } from '@/components/ProductCard';
import { Embers } from '@/components/Embers';
import { Marquee } from '@/components/Marquee';
import { getProducts, getZones } from '@/lib/catalog';
import { getSettings } from '@/lib/settings';
import { activeProvider } from '@/lib/payments';
import { formatMoney } from '@/lib/pricing';
import { img, PHOTOS, srcSet } from '@/lib/img';

function Words({ text, offset = 0 }: { text: string; offset?: number }) {
  return <>{text.split(' ').map((w, i) => <span key={i}><span className="w" style={{ ['--i' as string]: i + offset }}>{w}</span>{' '}</span>)}</>;
}

export default async function HomePage() {
  const [s, products, zones] = await Promise.all([getSettings(), getProducts(), getZones()]);
  const { currency, locale, min_order_amount } = s.commerce;
  const featured = (products.filter((p) => p.is_featured).length >= 4 ? products.filter((p) => p.is_featured) : products).slice(0, 4);
  const showDemo = s.commerce.show_demo_notice;
  const provider = activeProvider();
  const maxTier = Math.round(Math.max(0, ...products.flatMap((p) => p.rules.filter((r) => r.rule_type === 'tier' && r.price_per_kg && p.base_price_per_kg > 0).map((r) => (1 - (r.price_per_kg as number) / p.base_price_per_kg) * 100))));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: s.company.name,
    description: 'Vente et livraison de bois de chauffage en France et en Europe',
    telephone: s.company.phone || undefined,
    email: s.company.email || undefined,
    areaServed: ['FR', 'BE', 'LU', 'CH', 'DE'],
    priceRange: '€€',
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
        <Embers count={30} />
        <div className="container">
          <div>
            <span className="chip fade-up"><Leaf size={16} aria-hidden /> Bois de chauffage livré en France</span>
            <h1 className="hero-title"><Words text="Votre bois de chauffage" /><span className="accent shimmer w" style={{ ['--i' as string]: 4 }}>au meilleur prix !</span></h1>
            <p className="hero-sub fade-up d2">Commandez en ligne, payez par carte en toute sécurité et recevez votre bois sec directement chez vous, partout en France et en Europe.</p>
            <div className="hero-actions fade-up d3">
              <Link href="/devis" className="btn btn-primary btn-lg btn-pulse">Commander maintenant <ArrowRight size={19} aria-hidden /></Link>
              <Link href="/boutique" className="btn btn-outline-light btn-lg">Découvrir nos bois <ArrowDown size={19} aria-hidden /></Link>
            </div>
          </div>
          <div><QuoteCalculator /></div>
        </div>
        <span className="scroll-cue" aria-hidden />
      </section>

      <Marquee />

      <section className="trust" aria-label="Nos engagements">
        <div className="container">
          {[
            { I: ShieldCheck, t: 'Paiement sécurisé', d: provider === 'stripe' ? 'Carte bancaire · Stripe' : 'Carte bancaire' },
            { I: Truck, t: 'Livraison rapide', d: 'France & Europe' },
            { I: Headset, t: 'Service client', d: 'À votre écoute' },
            { I: BadgeCheck, t: 'Qualité garantie', d: 'Bois sélectionné & séché' },
            { I: Handshake, t: 'Satisfaction client', d: 'Accompagnement personnalisé' },
          ].map(({ I, t, d }, n) => (
            <div className="trust-item" key={t} data-reveal="up" style={{ ['--d' as string]: `${n * 0.08}s` }}><I size={34} aria-hidden /><span>{t}<small>{d}</small></span></div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-title" data-reveal="blur"><span className="eyebrow">La boutique</span><h2>Nos bois de chauffage</h2><p>Des essences sélectionnées, séchées et prêtes à brûler. Choisissez la quantité exacte qu&apos;il vous faut, du sac de 25 kg à plusieurs tonnes.</p></div>
          <div className="products-layout">
            {featured.map((p, n) => (
              <div key={p.id} data-reveal="flip" style={{ ['--d' as string]: `${n * 0.1}s`, display: 'grid' }}>
                <ProductCard p={p} currency={currency} locale={locale} showDemo={showDemo} />
              </div>
            ))}
            <aside className="promo-card" data-reveal="right">
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>À partir de</div>
                <div className="big">{formatMoney(min_order_amount, currency, locale).replace(/,00/, '')}</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', marginTop: 6 }}>et jusqu&apos;à</div>
                <div style={{ color: 'var(--gold)', fontWeight: 900, fontSize: '1.5rem', fontFamily: 'var(--font-title)' }}>{formatMoney(1000, currency, locale).replace(/,00/, '')} et plus !</div>
                <div className="script">Commandez selon vos besoins !</div>
              </div>
              <Link href="/devis" className="btn btn-primary" style={{ marginTop: 18 }}>Calculer mon devis</Link>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img(PHOTOS.stack, 400, 300)} alt="" loading="lazy" aria-hidden className="float-slow" />
            </aside>
          </div>
          <div style={{ textAlign: 'center', marginTop: 30 }} data-reveal="up">
            <Link href="/boutique" className="btn btn-green">Voir toute la boutique <ArrowRight size={18} aria-hidden /></Link>
          </div>
        </div>
      </section>

      <section className="parallax" style={{ backgroundImage: `url(${img(PHOTOS.livingFire, 1800, 1000, 65)})` }}>
        <div className="container" data-reveal="zoom">
          <span className="eyebrow" style={{ color: 'var(--gold)' }}>Chaleur & confort</span>
          <h2>Un feu qui crépite, une maison chaude tout l&apos;hiver</h2>
          <p>Bois dense et bien sec : plus de chaleur, moins de fumée et une flamme qui dure. Pour poêle, insert, cheminée ou chaudière.</p>
          <Link href="/boutique" className="btn btn-primary btn-lg">Choisir mon bois <Flame size={19} aria-hidden /></Link>
        </div>
      </section>

      <section className="section section-beige">
        <div className="container">
          <div className="section-title" data-reveal="blur"><span className="eyebrow">Simple & rapide</span><h2>Commander en 4 étapes</h2><p>Un parcours simple, un prix calculé instantanément et un paiement 100 % sécurisé.</p></div>
          <div className="steps">
            {[
              { i: <Calculator size={22} />, ph: PHOTOS.oak, t: 'Choisissez votre bois', d: 'Sélectionnez l\'essence et la quantité en kg ou en tonnes : le prix s\'affiche en temps réel.' },
              { i: <Truck size={22} />, ph: PHOTOS.flatbed, t: 'Indiquez la livraison', d: 'Renseignez votre adresse : les frais sont calculés selon votre zone ou chiffrés par notre équipe.' },
              { i: <CreditCard size={22} />, ph: PHOTOS.stoveFlame, t: 'Payez en ligne', d: 'Réglez par carte en toute sécurité. Votre commande n\'est validée qu\'après confirmation réelle du paiement.' },
              { i: <PackageCheck size={22} />, ph: PHOTOS.shed, t: 'Recevez votre bois', d: 'Reçu PDF par e-mail, suivi en ligne et livraison à la date convenue.' },
            ].map((st, n) => (
              <div className="step" key={st.t} data-reveal="up" style={{ ['--d' as string]: `${n * 0.12}s` }}>
                <div className="step-img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img(st.ph, 500, 300)} alt="" loading="lazy" />
                </div>
                <div className="step-num">{n + 1}</div>
                <h3>{st.t}</h3>
                <p>{st.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section counters-band">
        <Embers count={14} />
        <div className="container" style={{ position: 'relative' }}>
          <div className="counters">
            <div className="counter" data-reveal="up"><b data-count={products.length}>0</b><span>essences au catalogue</span></div>
            <div className="counter" data-reveal="up" style={{ ['--d' as string]: '.1s' }}><b data-count={zones.length}>0</b><span>zones de livraison</span></div>
            <div className="counter" data-reveal="up" style={{ ['--d' as string]: '.2s' }}><b data-count={maxTier} data-prefix="-" data-suffix=" %">0</b><span>de remise sur les gros volumes</span></div>
            <div className="counter" data-reveal="up" style={{ ['--d' as string]: '.3s' }}><b data-count={24} data-suffix=" h/24">0</b><span>commande en ligne</span></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div className="split-media" data-reveal="left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img(PHOTOS.truck, 900, 675)} srcSet={srcSet(PHOTOS.truck, [500, 900, 1300], 4 / 3)} sizes="(max-width: 1020px) 100vw, 50vw"
              alt="Camion chargé de bois prêt pour la livraison" loading="lazy" width={900} height={675} />
            <div className="split-badge">Livraison à domicile</div>
          </div>
          <div data-reveal="right">
            <span className="chip" style={{ background: 'var(--beige)', color: 'var(--green)', borderColor: 'var(--line)' }}><Truck size={16} aria-hidden /> Préparation & livraison</span>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', marginTop: 14 }}>Nous préparons et livrons votre bois</h2>
            <p style={{ color: 'var(--muted)' }}>De la sélection en forêt jusqu&apos;à votre porte, nous maîtrisons chaque étape pour vous garantir un bois sec, propre et prêt à l&apos;emploi. Livraison à Paris, en Île-de-France, en province et dans plusieurs pays européens.</p>
            <ul className="check-list">
              <li><CheckCircle2 size={20} aria-hidden /> Bois séché pour une combustion efficace et peu de fumée</li>
              <li><CheckCircle2 size={20} aria-hidden /> Quantités sur mesure, du particulier au professionnel</li>
              <li><CheckCircle2 size={20} aria-hidden /> Tarifs dégressifs automatiques sur les gros volumes</li>
              <li><CheckCircle2 size={20} aria-hidden /> Suivi de commande en ligne à chaque étape</li>
            </ul>
            <Link href="/livraison-retours" className="btn btn-green">Zones & tarifs de livraison <ArrowRight size={18} aria-hidden /></Link>
          </div>
        </div>
      </section>

      <section className="section section-beige">
        <div className="container">
          <div className="section-title" data-reveal="blur"><span className="eyebrow">Nos engagements</span><h2>Du bois choisi avec soin</h2><p>Survolez chaque carte pour en savoir plus.</p></div>
          <div className="img-cards">
            {[
              { ph: PHOTOS.forest, n: '01', t: 'Sélection en forêt', d: 'Des essences dures et denses (chêne, hêtre, charme) pour un pouvoir calorifique élevé.' },
              { ph: PHOTOS.splitting, n: '02', t: 'Fendu & calibré', d: 'Bûches coupées aux dimensions de votre appareil : poêle, insert ou cheminée.' },
              { ph: PHOTOS.cabinStove, n: '03', t: 'Séché, prêt à brûler', d: 'Un bois sec chauffe mieux, encrasse moins et dégage moins de fumée.' },
            ].map((c, i) => (
              <article className="img-card" key={c.n} tabIndex={0} data-reveal="up" style={{ ['--d' as string]: `${i * 0.12}s` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img(c.ph, 700, 800)} alt="" loading="lazy" />
                <div className="img-card-body"><span className="num">{c.n}</span><h3>{c.t}</h3><p>{c.d}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-title" data-reveal="blur"><span className="eyebrow">En images</span><h2>De la forêt à votre foyer</h2></div>
          <div className="gallery">
            {[
              { ph: PHOTOS.livingRoom, c: 'Un salon chaleureux', k: 'tall' },
              { ph: PHOTOS.bigPile, c: 'Stock prêt à livrer', k: 'wide' },
              { ph: PHOTOS.axeLog, c: 'Bûches fendues', k: '' },
              { ph: PHOTOS.stove, c: 'Idéal pour poêle', k: '' },
              { ph: PHOTOS.kindling, c: 'Bois d\'allumage', k: '' },
              { ph: PHOTOS.winter, c: 'Prêt pour l\'hiver', k: 'wide' },
              { ph: PHOTOS.fire, c: 'Une belle flambée', k: '' },
              { ph: PHOTOS.neat, c: 'Rangement soigné', k: '' },
              { ph: PHOTOS.oak, c: 'Chêne de qualité', k: '' },
            ].map((g, i) => (
              <figure key={g.c} className={g.k} data-reveal="zoom" style={{ ['--d' as string]: `${i * 0.07}s` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img(g.ph, g.k === 'wide' ? 900 : 500, g.k === 'tall' ? 840 : 420)} alt={g.c} loading="lazy" />
                <figcaption>{g.c}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="section-sm">
        <div className="container">
          <div className="cta-band" data-reveal="zoom" style={{ backgroundImage: `linear-gradient(100deg, rgba(5,43,18,.95), rgba(5,43,18,.75)), url(${img(PHOTOS.stack, 1400, 500, 60)})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div>
              <h2>Besoin d&apos;un grand volume ?</h2>
              <p>Calculez votre devis en 30 secondes, ou contactez-nous pour une livraison sur mesure en France ou en Europe.</p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/devis" className="btn btn-lg btn-pulse">Calculer mon devis</Link>
              <Link href="/contact" className="btn btn-outline-light btn-lg">Nous contacter</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
