import { AuthSplit } from '@/components/AuthSplit';
import { PHOTOS } from '@/lib/img';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHero } from '@/components/PageHero';
import { LoginForm } from '@/components/AuthForms';

export const metadata: Metadata = { title: 'Connexion', robots: { index: false } };

export default function Page() {
  return (
    <>
      <PageHero image={PHOTOS.livingRoom} title="Connexion" crumbs={[{ href: '/compte', label: 'Mon compte' }]} />
      <section className="section"><div className="container"><AuthSplit image={PHOTOS.livingRoom} title="Bon retour parmi nous" text="Retrouvez vos commandes, vos reçus et le suivi de vos livraisons."><Suspense><LoginForm /></Suspense></AuthSplit></div></section>
    </>
  );
}
