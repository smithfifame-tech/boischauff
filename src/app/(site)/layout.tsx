import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DemoNotice } from '@/components/DemoNotice';
import { SiteProvider } from '@/components/SiteProvider';
import { ScrollFX } from '@/components/ScrollFX';
import { getSettings } from '@/lib/settings';
import { getProducts, getZones, publicProduct, publicZone } from '@/lib/catalog';
import { getCurrentUser } from '@/lib/auth';
import { activeProvider } from '@/lib/payments';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [s, products, zones, user] = await Promise.all([getSettings(), getProducts(), getZones(), getCurrentUser().catch(() => null)]);
  const paymentMode = activeProvider();
  const demoPrices = s.commerce.show_demo_notice && (products.some((p) => p.is_demo_price) || zones.some((z) => z.is_demo));
  return (
    <SiteProvider
      products={products.map(publicProduct)}
      zones={zones.map(publicZone)}
      paymentMode={paymentMode}
      commerce={{ currency: s.commerce.currency, locale: s.commerce.locale, taxRate: s.commerce.tax_rate, taxLabel: s.commerce.tax_label,
        minOrderAmount: s.commerce.min_order_amount, guestCheckout: s.commerce.guest_checkout, showDemoNotice: s.commerce.show_demo_notice }}
      company={{ name: s.company.name, phone: s.company.phone, email: s.company.email, deliveryArea: s.company.delivery_area }}
    >
      <a href="#contenu" className="skip-link">Aller au contenu</a>
      <DemoNotice demoPrices={demoPrices} paymentMode={paymentMode} />
      <Header name={s.company.name} tagline={s.company.tagline} logoUrl={s.company.logo_url} loggedIn={Boolean(user)} />
      <main id="contenu">{children}</main>
      <Footer s={s} paymentMode={paymentMode} />
      <ScrollFX />
    </SiteProvider>
  );
}
