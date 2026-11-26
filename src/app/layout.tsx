import type { Metadata, Viewport } from 'next';
import './globals.css';
import { getSettings, siteUrl } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const name = s.company.name;
  const description = `${name} — vente et livraison de bois de chauffage de qualité. Calculez votre devis, commandez en ligne, payez en toute sécurité et recevez votre bois chez vous.`;
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${name} — Bois de chauffage livré chez vous`, template: `%s | ${name}` },
    description,
    applicationName: name,
    keywords: ['bois de chauffage', 'livraison bois', 'bois sec', 'bois dur', 'chêne', 'bois d\'allumage', 'Bénin', 'Cotonou'],
    openGraph: { type: 'website', locale: 'fr_FR', siteName: name, title: `${name} — Votre bois de chauffage au meilleur prix`, description,
      images: [{ url: 'https://images.unsplash.com/photo-1592751854100-135b9021364c?auto=format&fit=crop&w=1200&h=630&q=70', width: 1200, height: 630, alt: 'Bois de chauffage empilé' }] },
    twitter: { card: 'summary_large_image', title: name, description },
    alternates: { canonical: '/' },
    icons: { icon: '/icon.svg' },
  };
}

export const viewport: Viewport = { themeColor: '#073B19', width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  const c = s.company;
  const vars = { '--green': c.primary_color, '--green-dark': c.primary_dark, '--orange': c.accent_color, '--gold': c.gold_color } as React.CSSProperties;
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Merriweather:wght@700;900&family=Nunito+Sans:ital,opsz,wght@0,6..12,400;0,6..12,600;0,6..12,700;0,6..12,800;0,6..12,900;1,6..12,600&display=swap" />
      </head>
      <body style={vars}>{children}</body>
    </html>
  );
}
