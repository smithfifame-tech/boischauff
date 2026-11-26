import { Fragment } from 'react';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { getSettings } from '@/lib/settings';
import { activeProvider, saaspayConfig } from '@/lib/payments';
import { mailTransportName } from '@/lib/mailer';

export default async function AdminSettings() {
  const s = await getSettings();
  const sp = saaspayConfig();
  const status = [
    ['Passerelle active', activeProvider() === 'saaspay' ? 'SaaSPay (réel)' : activeProvider() === 'demo' ? 'Démonstration' : 'Aucune'],
    ['SAASPAY_API_BASE_URL', sp.baseUrl ? 'configurée' : 'manquante'],
    ['SAASPAY_SECRET_KEY', sp.secretKey ? 'configurée' : 'manquante'],
    ['SAASPAY_WEBHOOK_SECRET', sp.webhookSecret ? 'configurée' : 'manquante'],
    ['Service e-mail', mailTransportName() === 'none' ? 'non configuré' : mailTransportName().toUpperCase()],
  ];
  return (
    <>
      <div className="admin-head"><h1>Paramètres</h1></div>
      <div className="panel">
        <h2>Services externes</h2>
        <p className="hint">Les clés sont gérées uniquement dans les variables d&apos;environnement de l&apos;hébergeur (jamais dans la base ni dans le navigateur).</p>
        <dl className="kv">{status.map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd><span className={`badge ${/manquante|non configuré|Aucune|Démonstration/.test(v) ? 'b-orange' : 'b-green'}`}>{v}</span></dd></Fragment>)}</dl>
        <p className="hint" style={{ marginTop: 12, marginBottom: 0 }}>URL de webhook à déclarer chez SaaSPay : <code>{'{votre-domaine}'}/api/webhooks/saaspay</code></p>
      </div>
      <SettingsForm initial={s} />
    </>
  );
}
