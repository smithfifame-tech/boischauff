import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHero } from '@/components/PageHero';
import { RegisterForm } from '@/components/AuthForms';

export const metadata: Metadata = { title: 'Créer un compte', robots: { index: false } };

export default function Page() {
  return (
    <>
      <PageHero title="Créer un compte" crumbs={[{ href: '/compte', label: 'Mon compte' }]} />
      <section className="section"><div className="container"><Suspense><RegisterForm /></Suspense></div></section>
    </>
  );
}
