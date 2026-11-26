import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHero } from '@/components/PageHero';
import { LoginForm } from '@/components/AuthForms';

export const metadata: Metadata = { title: 'Connexion', robots: { index: false } };

export default function Page() {
  return (
    <>
      <PageHero title="Connexion" crumbs={[{ href: '/compte', label: 'Mon compte' }]} />
      <section className="section"><div className="container"><Suspense><LoginForm /></Suspense></div></section>
    </>
  );
}
