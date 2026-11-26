import { PHOTOS } from '@/lib/img';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHero } from '@/components/PageHero';
import { ResetForm } from '@/components/AuthForms';

export const metadata: Metadata = { title: 'Réinitialisation', robots: { index: false } };

export default function Page() {
  return (
    <>
      <PageHero image={PHOTOS.axe} title="Réinitialisation" crumbs={[{ href: '/compte', label: 'Mon compte' }]} />
      <section className="section"><div className="container"><Suspense><ResetForm /></Suspense></div></section>
    </>
  );
}
