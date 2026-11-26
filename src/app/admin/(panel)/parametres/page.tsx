import { Fragment } from 'react';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { getSettings } from '@/lib/settings';
import { activeProvider, saspayConfig, saspayKeyMatchesEnv, SASPAY_CURRENCIES } from '@/lib/payments';
import { mailTransportName } from '@/lib/mailer';

export default async function AdminSettings() {
  const s = await getSettings();
  const sp = saspayConfig();
  const status = [
    ['Passerelle active', activeProvider() === 'saspay' ? `SasPay (${sp.env === 'live' ? 'réel' : 'test'})` : activeProvider() === 'demo' ? 'Démonstration' : 'Aucune'],
    ['SASPAY_ENVIRONMENT', sp.env === 'live' ? 'live (réel)' : 'sandbox (test)'],
    ['SASPAY_SECRET_KEY', !sp.secretKey ? 'manquante' : saspayKeyMatchesEnv() ? 'configurée' : 'incohérente avec l\'environnement'],
    ['SASPAY_WEBHOOK_SECRET', sp.webhookSecret ? 'configurée' : 'manquante'],
    ['Devise du site', SASPAY_CURRENCIES.includes(s.commerce.currency) ? `${s.commerce.currency} — acceptée par SasPay` : `${s.commerce.currency} — non acceptée par SasPay (passer en XOF)`],
    ['Service e-mail', mailTransportName() === 'none' ? 'non configuré' : mailTransportName().toUpperCase()],
  ];
  return (
    <>
      <div className="admin-head"><h1>Paramètres</h1></div>
      <div className="panel">
        <h2>Services externes</h2>
        <p className="hint">Les clés sont gérées uniquement dans les variables d&apos;environnement de l&apos;hébergeur (jamais dans la base ni dans le navigateur).</p>
        <dl className="kv">{status.map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd><span className={`badge ${/manquante|non configuré|Aucune|Démonstration|incohérente|non acceptée|test/.test(v) ? 'b-orange' : 'b-green'}`}>{v}</span></dd></Fragment>)}</dl>
        <p className="hint" style={{ marginTop: 12, marginBottom: 0 }}>URL de webhook à déclarer dans SasPay (événement transaction.success) : <code>{'{votre-domaine}'}/api/webhooks/saspay</code></p>
      </div>
      <SettingsForm initial={s} />
    </>
  );
}
