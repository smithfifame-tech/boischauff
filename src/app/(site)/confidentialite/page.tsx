import { PHOTOS } from '@/lib/img';
import type { Metadata } from 'next';
import { LegalPage, ToComplete } from '@/components/LegalPage';
import { getSettings } from '@/lib/settings';

export const metadata: Metadata = { title: 'Politique de confidentialité', alternates: { canonical: '/confidentialite' } };

export default async function PrivacyPage() {
  const s = await getSettings();
  return (
    <LegalPage image={PHOTOS.birch} title="Politique de confidentialité" intro="Conforme au Règlement général sur la protection des données (RGPD) et à la loi Informatique et Libertés.">
      <h2>Responsable du traitement</h2>
      <p>{s.company.name} — contact : {s.company.email || <ToComplete>e-mail</ToComplete>}.</p>
      <h2>Données collectées</h2>
      <ul>
        <li>Identité et coordonnées : nom, prénom, e-mail, téléphone ;</li>
        <li>Adresse de livraison et instructions ;</li>
        <li>Historique des commandes et statut des paiements (aucune donnée de carte bancaire n&apos;est stockée par nos soins) ;</li>
        <li>Données de compte : e-mail et mot de passe chiffré (hachage bcrypt).</li>
      </ul>
      <h2>Finalités</h2>
      <p>Traitement et livraison des commandes, émission des reçus, service client, sécurité du site (prévention de la fraude et des abus).</p>
      <h2>Destinataires</h2>
      <p>Notre équipe, notre prestataire de paiement, notre prestataire d&apos;envoi d&apos;e-mails et notre hébergeur, chacun pour la seule exécution de sa mission.</p>
      <h2>Durée de conservation</h2>
      <p>Les données de commande sont conservées pour la durée nécessaire aux obligations comptables et légales <ToComplete>durée</ToComplete>.</p>
      <h2>Cookies</h2>
      <p>Le site n&apos;utilise que des cookies strictement nécessaires : session client ou administrateur, jeton de sécurité anti-CSRF et panier. Aucun cookie publicitaire.</p>
      <h2>Vos droits</h2>
      <p>Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de limitation, d&apos;opposition et de portabilité de vos données, en écrivant à {s.company.email || 'notre adresse de contact'}. Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).</p>
    </LegalPage>
  );
}
