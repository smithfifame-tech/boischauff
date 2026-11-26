import { PHOTOS } from '@/lib/img';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHero } from '@/components/PageHero';
import { ForgotForm } from '@/components/AuthForms';

export const metadata: Metadata = { title: 'Mot de passe oublié', robots: { index: false } };

export default function Page() {
  return (
    <>
      <PageHero image={PHOTOS.axe} title="Mot de passe oublié" crumbs={[{ href: '/compte', label: 'Mon compte' }]} />
      <section className="section"><div className="container"><Suspense><ForgotForm /></Suspense></div></section>
    </>
  );
}
