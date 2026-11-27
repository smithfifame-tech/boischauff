import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/PageHero';

export const metadata: Metadata = { title: 'Désinscription', robots: { index: false } };

export default function Page() {
  return (
    <>
      <PageHero title="Désinscription confirmée" />
      <section className="section"><div className="container"><div className="card card-pad" style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        <p>Vous ne recevrez plus notre newsletter. Vous pouvez vous réinscrire à tout moment depuis le bas de chaque page.</p>
        <Link href="/" className="btn btn-primary">Retour à l&apos;accueil</Link>
      </div></div></section>
    </>
  );
}
