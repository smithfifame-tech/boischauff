import { AuthSplit } from '@/components/AuthSplit';
import { PHOTOS } from '@/lib/img';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHero } from '@/components/PageHero';
import { RegisterForm } from '@/components/AuthForms';

export const metadata: Metadata = { title: 'Créer un compte', robots: { index: false } };

export default function Page() {
  return (
    <>
      <PageHero image={PHOTOS.livingRoom} title="Créer un compte" crumbs={[{ href: '/compte', label: 'Mon compte' }]} />
      <section className="section"><div className="container"><AuthSplit image={PHOTOS.cabinStove} title="Créez votre compte" text="Commandez plus vite et suivez toutes vos livraisons au même endroit."><Suspense><RegisterForm /></Suspense></AuthSplit></div></section>
    </>
  );
}
