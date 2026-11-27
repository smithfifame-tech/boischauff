import { AuthSplit } from '@/components/AuthSplit';
import { PHOTOS } from '@/lib/img';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHero } from '@/components/PageHero';
import { QuickAuth } from '@/components/QuickAuth';

export const metadata: Metadata = { title: 'Connexion', robots: { index: false } };

export default function Page() {
  return (
    <>
      <PageHero image={PHOTOS.livingRoom} title="Connexion" intro="Un seul formulaire pour vous connecter ou créer votre compte." crumbs={[{ href: '/compte', label: 'Mon compte' }]} />
      <section className="section"><div className="container"><AuthSplit image={PHOTOS.livingRoom} title="Bon retour parmi nous" text="Retrouvez vos commandes, vos reçus et le suivi de vos livraisons."><Suspense><QuickAuth title="Connexion ou inscription" subtitle="Entrez votre e-mail et un mot de passe : nous faisons le reste." /></Suspense></AuthSplit></div></section>
    </>
  );
}
