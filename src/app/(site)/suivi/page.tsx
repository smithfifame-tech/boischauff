import type { Metadata } from 'next';
import { PageHero } from '@/components/PageHero';
import { TrackOrder } from '@/components/TrackOrder';

export const metadata: Metadata = { title: 'Suivi de commande', description: 'Suivez l\'avancement de votre commande de bois de chauffage.', alternates: { canonical: '/suivi' } };
type Props = { searchParams: Promise<{ order?: string }> };

export default async function TrackPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <>
      <PageHero title="Suivi de commande" intro="Saisissez votre numéro de commande et l'e-mail ou le téléphone utilisé lors de la commande." />
      <section className="section"><div className="container" style={{ maxWidth: 980 }}><TrackOrder initialOrder={sp.order ?? ''} /></div></section>
    </>
  );
}
