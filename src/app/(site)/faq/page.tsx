import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/PageHero';
import { FAQ } from '@/lib/faq';

export const metadata: Metadata = { title: 'FAQ — questions fréquentes', description: 'Prix, livraison, paiement, reçus et suivi : toutes les réponses sur nos commandes de bois de chauffage.', alternates: { canonical: '/faq' } };

export default function FaqPage() {
  const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <PageHero title="Questions fréquentes" intro="Tout ce qu'il faut savoir avant de commander votre bois de chauffage." />
      <section className="section">
        <div className="container">
          <div className="faq">{FAQ.map((f, i) => <details key={f.q} open={i === 0}><summary>{f.q}</summary><p>{f.a}</p></details>)}</div>
          <p style={{ textAlign: 'center', marginTop: 28 }}>Vous ne trouvez pas votre réponse ? <Link href="/contact" style={{ color: 'var(--orange)', fontWeight: 800 }}>Contactez-nous</Link></p>
        </div>
      </section>
    </>
  );
}
