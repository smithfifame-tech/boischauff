import Link from 'next/link';
import { ArrowRight, BadgeCheck, Calculator, CheckCircle2, CreditCard, Flame, Gem, Headset, Home as HomeIcon, Leaf, PackageCheck, Play, ShieldCheck, Truck } from 'lucide-react';
import { ReviewCarousel } from '@/components/ReviewCarousel';
import { Sparkles } from '@/components/Sparkles';
import { getApprovedReviews, getProductRatings } from '@/lib/reviews';
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
  const [s, products, zones, reviews, ratings] = await Promise.all([getSettings(), getProducts(), getZones(), getApprovedReviews(8), getProductRatings()]);
  const { currency, locale, min_order_amount } = s.commerce;
  const featured = (products.filter((p) => p.is_featured).length >= 4 ? products.filter((p) => p.is_featured) : products).slice(0, 4);
  const showDemo = s.commerce.show_demo_notice;
  const provider = activeProvider();
  const bm = /^(Goden)(Wood.*)$/.exec(s.company.name);
  const brandA = bm?.[1]; const brandB = bm?.[2];
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
          <img src={img(PHOTOS.livingFire, 1600, 900, 70)} srcSet={srcSet(PHOTOS.livingFire, [800, 1200, 1600, 2200], 16 / 9)} sizes="100vw"
            alt="Poêle à bois allumé dans un salon chaleureux" fetchPriority="high" width={1600} height={900} />
        </div>
        <Embers count={34} />
        <Sparkles count={22} />
        <div className="container">
          <div>
            <span className="chip fade-up"><Flame size={17} aria-hidden /> Bois de chauffage premium</span>
            <div className="hero-brand fade-up d1" aria-hidden>{brandA ? <><span className="g">{brandA}</span>{brandB}</> : s.company.name}</div>
            <h1 className="hero-title"><Words text="Votre bois de chauffage" /><br /><span className="accent"><Words text="au meilleur prix !" offset={4} />
              <svg className="swoosh" viewBox="0 0 120 34" aria-hidden><path d="M4 26 C 40 6, 80 4, 116 10" /><path d="M14 31 C 46 18, 78 15, 104 18" style={{ strokeWidth: 4, animationDelay: '1.4s' }} /></svg></span></h1>
            <p className="hero-sub fade-up d2">Qualité supérieure<span className="dot">•</span>Livraison rapide<span className="dot">•</span>Paiement sécurisé</p>
            <div className="hero-actions fade-up d3">
              <Link href="/devis" className="btn btn-primary btn-lg btn-pulse">Commander dès maintenant <ArrowRight size={19} aria-hidden /></Link>
              <Link href="/a-propos" className="btn btn-outline-light btn-lg"><span className="btn-play"><Play size={13} fill="currentColor" aria-hidden /></span> Découvrir notre service</Link>
            </div>
          </div>
          <div><QuoteCalculator /></div>
        </div>
        <span className="scroll-cue" aria-hidden />
      </section>

      <section className="trust" aria-label="Nos engagements">
        <div className="container">
          {[
            { I: ShieldCheck, t: 'Paiement 100 % sécurisé', d: provider === 'saspay' ? '(via SasPay)' : provider === 'stripe' ? '(carte bancaire · Stripe)' : '(carte bancaire)' },
            { I: Truck, t: 'Livraison rapide', d: 'partout en France' },
            { I: Headset, t: 'Service client', d: 'réactif et à votre écoute' },
            { I: Gem, t: 'Bois de qualité', d: 'sélectionné et séché' },
            { I: Leaf, t: 'Chauffage naturel', d: 'énergie renouvelable' },
          ].map(({ I, t, d }, n) => (
            <div className="trust-item" key={t} data-reveal="up" style={{ ['--d' as string]: `${n * 0.08}s` }}><I size={38} aria-hidden /><span>{t}<small>{d}</small></span></div>
          ))}
        </div>
      </section>

      <section className="range">
        <Sparkles count={14} />
        <div className="container" style={{ position: 'relative' }}>
          <div className="range-head">
            <div className="section-title" data-reveal="blur"><span className="eyebrow">Notre gamme</span><h2>Nos bois de chauffage</h2><span className="script-sub">Le choix parfait pour un hiver au chaud</span></div>
            <Link href="/boutique" className="btn btn-outline-gold" data-reveal="left">Voir toute la boutique <ArrowRight size={17} aria-hidden /></Link>
          </div>
          <div className="range-grid">
            <aside className="why-card" data-reveal="left">
              <h3><HomeIcon size={34} aria-hidden /> Un chauffage naturel et économique</h3>
              <ul>
                <li><CheckCircle2 size={18} aria-hidden /> Bois sec et de qualité</li>
                <li><CheckCircle2 size={18} aria-hidden /> Livraison rapide</li>
                <li><CheckCircle2 size={18} aria-hidden /> Prix transparents</li>
                <li><CheckCircle2 size={18} aria-hidden /> Tarifs dégressifs</li>
              </ul>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img(PHOTOS.logs, 400, 220)} alt="" loading="lazy" className="float-slow" />
            </aside>
            {featured.map((p, n) => (
              <div key={p.id} data-reveal="flip" style={{ ['--d' as string]: `${n * 0.1}s`, display: 'grid' }}>
                <ProductCard p={p} currency={currency} locale={locale} showDemo={showDemo} rating={ratings[p.id]} />
              </div>
            ))}
            <ReviewCarousel reviews={reviews.map((r) => ({ id: r.id, author: r.author, city: r.city, rating: r.rating, comment: r.comment }))} />
          </div>
        </div>
      </section>

      <Marquee />

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
