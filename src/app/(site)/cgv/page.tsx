import { PHOTOS } from '@/lib/img';
import type { Metadata } from 'next';
import { LegalPage, ToComplete } from '@/components/LegalPage';
import { getSettings } from '@/lib/settings';

export const metadata: Metadata = { title: 'Conditions générales de vente', alternates: { canonical: '/cgv' } };

export default async function CgvPage() {
  const s = await getSettings();
  const n = s.company.name;
  return (
    <LegalPage image={PHOTOS.neat} title="Conditions générales de vente" intro="Modèle à faire valider par un professionnel du droit avant la mise en production.">
      <h2>1. Vendeur</h2>
      <p>Le site est édité par {n}{s.company.address ? `, ${s.company.address}` : ''}. Contact : {s.company.email || <ToComplete>e-mail</ToComplete>}{s.company.phone ? `, ${s.company.phone}` : ''}. Forme juridique et immatriculation : <ToComplete>forme juridique, RCCM, IFU</ToComplete>.</p>
      <h2>2. Objet</h2>
      <p>Les présentes conditions régissent la vente en ligne de bois de chauffage et sa livraison par {n}. Toute commande implique leur acceptation sans réserve.</p>
      <h2>3. Produits et prix</h2>
      <p>Les produits sont décrits avec la plus grande exactitude possible. Les prix sont exprimés en {s.commerce.currency}, au kilogramme, avec des tarifs dégressifs selon la quantité. Le prix applicable est celui affiché au moment de la validation de la commande et recalculé par nos serveurs. Les frais de livraison sont indiqués avant le paiement ; lorsqu&apos;ils nécessitent un chiffrage, le client en est informé et ne paie qu&apos;après communication du montant définitif.</p>
      <h2>4. Commande</h2>
      <p>La commande est enregistrée après validation du formulaire. Un devis numéroté est présenté avant le paiement. La vente est conclue à la confirmation du paiement par la passerelle de paiement.</p>
      <h2>5. Paiement</h2>
      <p>Le paiement s&apos;effectue en ligne via notre prestataire de paiement sécurisé. Aucune donnée bancaire n&apos;est conservée par {n}. Un reçu est adressé par e-mail après confirmation du paiement.</p>
      <h2>6. Livraison</h2>
      <p>La livraison est assurée par {n} à l&apos;adresse indiquée, dans la zone choisie. Les délais communiqués sont indicatifs. Le client veille à l&apos;accessibilité du lieu de livraison. Voir la <a href="/livraison-retours">politique de livraison et de retour</a>.</p>
      <h2>7. Réclamations et retours</h2>
      <p>Toute réserve sur la quantité ou la qualité doit être signalée à la livraison ou dans un délai de <ToComplete>délai en jours</ToComplete> par e-mail.</p>
      <h2>8. Données personnelles</h2>
      <p>Voir notre <a href="/confidentialite">politique de confidentialité</a>.</p>
      <h2>9. Droit applicable</h2>
      <p>Les présentes conditions sont soumises au droit <ToComplete>pays / juridiction compétente</ToComplete>.</p>
    </LegalPage>
  );
}
