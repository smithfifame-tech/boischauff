import { Fragment } from 'react';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { getSettings } from '@/lib/settings';
import { activeProvider, saspayConfig, saspayKeyMatchesEnv, SASPAY_CURRENCIES, stripeConfig, stripeMode } from '@/lib/payments';
import { mailTransportName } from '@/lib/mailer';

export default async function AdminSettings() {
  const s = await getSettings();
  const sp = saspayConfig();
  const st = stripeConfig();
  const ap = activeProvider();
  const status = [
    ['Passerelle active', ap === 'stripe' ? `Stripe (${stripeMode() === 'live' ? 'réel' : 'test'})` : ap === 'saspay' ? `SasPay (${sp.env === 'live' ? 'réel' : 'test'})` : ap === 'demo' ? 'Démonstration' : 'Aucune'],
    ['STRIPE_SECRET_KEY', st.secretKey ? (stripeMode() === 'live' ? 'configurée (réel)' : 'configurée (test)') : 'manquante'],
    ['STRIPE_WEBHOOK_SECRET', st.webhookSecret ? 'configurée' : 'manquante'],
    ['SASPAY_ENVIRONMENT', sp.env === 'live' ? 'live (réel)' : 'sandbox (test)'],
    ['SASPAY_SECRET_KEY', !sp.secretKey ? 'manquante' : saspayKeyMatchesEnv() ? 'configurée' : 'incohérente avec l\'environnement'],
    ['SASPAY_WEBHOOK_SECRET', sp.webhookSecret ? 'configurée' : 'manquante'],
    ['Devise du site', `${s.commerce.currency}${SASPAY_CURRENCIES.includes(s.commerce.currency) ? ' (compatible Stripe et SasPay)' : ' (compatible Stripe)'}`],
    ['Service e-mail', mailTransportName() === 'none' ? 'non configuré' : mailTransportName().toUpperCase()],
  ];
  return (
    <>
      <div className="admin-head"><h1>Paramètres</h1></div>
      <div className="panel">
        <h2>Services externes</h2>
        <p className="hint">Les clés sont gérées uniquement dans les variables d&apos;environnement de l&apos;hébergeur (jamais dans la base ni dans le navigateur).</p>
        <dl className="kv">{status.map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd><span className={`badge ${/manquante|non configuré|Aucune|Démonstration|incohérente|test/.test(v) ? 'b-orange' : 'b-green'}`}>{v}</span></dd></Fragment>)}</dl>
        <p className="hint" style={{ marginTop: 12, marginBottom: 0 }}>Webhook Stripe : <code>{'{votre-domaine}'}/api/webhooks/stripe</code> (événements checkout.session.completed, async_payment_succeeded, async_payment_failed, expired). Webhook SasPay (option FCFA) : <code>{'{votre-domaine}'}/api/webhooks/saspay</code></p>
      </div>
      <SettingsForm initial={s} />
    </>
  );
}
