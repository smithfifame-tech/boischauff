import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, Flame, Leaf, ShieldCheck, Truck } from 'lucide-react';
import { PageHero } from '@/components/PageHero';
import { getSettings } from '@/lib/settings';
import { img, PHOTOS, PHOTO_CREDITS } from '@/lib/img';

export const metadata: Metadata = { title: 'À propos', description: 'Notre métier : sélectionner, sécher, préparer et livrer un bois de chauffage de qualité.', alternates: { canonical: '/a-propos' } };

export default async function AboutPage() {
  const s = await getSettings();
  return (
    <>
      <PageHero title={`À propos de ${s.company.name}`} intro={s.company.tagline} />
      <section className="section">
        <div className="container split">
          <div>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}>Un bois de chauffage choisi avec exigence</h2>
            <p style={{ color: 'var(--muted)' }}>{s.company.name} est spécialisée dans la vente et la livraison de bois de chauffage. Nous sélectionnons nos essences, les laissons sécher le temps nécessaire et préparons chaque commande avec soin, du sac de 50 kg aux livraisons de plusieurs tonnes.</p>
            <p style={{ color: 'var(--muted)' }}>Notre objectif : vous permettre de commander en quelques minutes, au juste prix, avec un paiement sécurisé et une livraison fiable.</p>
            <ul className="check-list">
              <li><CheckCircle2 size={20} aria-hidden /> Préparation et livraison assurées par notre équipe</li>
              <li><CheckCircle2 size={20} aria-hidden /> Prix transparents et dégressifs, calculés au kilo</li>
              <li><CheckCircle2 size={20} aria-hidden /> Reçu, suivi et service client à chaque étape</li>
            </ul>
            <Link href="/boutique" className="btn btn-primary">Découvrir nos bois</Link>
          </div>
          <div className="split-media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img(PHOTOS.forest, 900, 675)} alt="Grumes de bois récoltées" loading="lazy" width={900} height={675} />
          </div>
        </div>
      </section>
      <section className="section section-beige">
        <div className="container">
          <div className="section-title"><h2>Nos engagements</h2></div>
          <div className="steps">
            {[
              { i: <Leaf size={22} />, t: 'Qualité', d: 'Des essences adaptées à chaque usage et un séchage maîtrisé.' },
              { i: <Flame size={22} />, t: 'Performance', d: 'Un bois sec qui chauffe mieux, fume moins et encrasse moins.' },
              { i: <Truck size={22} />, t: 'Livraison', d: 'Une équipe qui prépare et livre votre commande à l\'adresse convenue.' },
              { i: <ShieldCheck size={22} />, t: 'Sécurité', d: 'Paiement vérifié côté serveur, données protégées, reçu systématique.' },
            ].map((x) => <div className="step" key={x.t}><div className="step-num">{x.i}</div><h3>{x.t}</h3><p>{x.d}</p></div>)}
          </div>
        </div>
      </section>
      <section className="section-sm"><div className="container"><p className="hint" style={{ textAlign: 'center' }}>Crédits photos : {PHOTO_CREDITS.join(', ')} — via Unsplash.</p></div></section>
    </>
  );
}
