import 'server-only';
import { getFullOrder, ORDER_STATUSES, PAYMENT_STATUSES, type FullOrder } from './orders';
import { getSettings, orderInbox, siteUrl, type AllSettings } from './settings';
import { sendMail } from './mailer';
import { buildReceiptPdf } from './pdf';
import { formatMoney, formatQty } from './pricing';

export function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

const fmtDate = (d: Date | string | null) =>
  d ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Paris' }) : '—';

function layout(s: AllSettings, title: string, preheader: string, body: string) {
  const c = s.company;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#F6F1E8;font-family:Arial,Helvetica,sans-serif;color:#1f2421;">
<span style="display:none!important;opacity:0;color:transparent;max-height:0;overflow:hidden">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F1E8;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 18px rgba(0,0,0,.06)">
<tr><td style="background:${esc(c.primary_color)};padding:22px 28px;border-bottom:4px solid ${esc(c.accent_color)}">
  <div style="font-size:24px;font-weight:bold;color:#fff;font-family:Georgia,serif">🔥 ${esc(c.name)}</div>
  <div style="font-size:13px;color:${esc(c.gold_color)};margin-top:4px">${esc(c.tagline)}</div>
</td></tr>
<tr><td style="padding:28px">${body}</td></tr>
<tr><td style="background:#052B12;padding:18px 28px;color:#cfe0d3;font-size:12px;line-height:1.6">
  ${esc(c.name)}${c.phone ? ` · ${esc(c.phone)}` : ''}${c.email ? ` · <a href="mailto:${esc(c.email)}" style="color:#FFC928">${esc(c.email)}</a>` : ''}<br>
  ${esc(c.delivery_area)}<br><a href="${esc(siteUrl())}" style="color:#FFC928">${esc(siteUrl().replace(/^https?:\/\//, ''))}</a>
</td></tr></table></td></tr></table></body></html>`;
}

function button(href: string, label: string, color = '#F47A08') {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0"><tr><td style="background:${color};border-radius:8px">
<a href="${esc(href)}" style="display:inline-block;padding:13px 22px;color:#fff;text-decoration:none;font-weight:bold;font-size:15px">${esc(label)}</a></td></tr></table>`;
}

function orderTable(o: FullOrder, s: AllSettings) {
  const m = (v: number | null) => (v === null ? 'Sur devis' : formatMoney(v, o.currency, s.commerce.locale));
  const rows = o.items.map((i) => `<tr>
    <td style="padding:10px 8px;border-bottom:1px solid #eee"><strong>${esc(i.product_name)}</strong><br><span style="color:#777;font-size:12px">${esc(i.pricing_label)}</span></td>
    <td style="padding:10px 8px;border-bottom:1px solid #eee;white-space:nowrap">${esc(formatQty(i.quantity_kg))}</td>
    <td style="padding:10px 8px;border-bottom:1px solid #eee;white-space:nowrap">${esc(m(i.unit_price_kg))}/kg</td>
    <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap"><strong>${esc(m(i.line_total))}</strong></td></tr>`).join('');
  const line = (k: string, v: string, strong = false) =>
    `<tr><td colspan="3" style="padding:6px 8px;text-align:right;color:#555">${esc(k)}</td><td style="padding:6px 8px;text-align:right;white-space:nowrap">${strong ? `<strong style="font-size:17px;color:#073B19">${esc(v)}</strong>` : esc(v)}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;margin:12px 0">
  <tr style="background:#F6F1E8"><th align="left" style="padding:8px">Produit</th><th align="left" style="padding:8px">Qté</th><th align="left" style="padding:8px">Prix unit.</th><th align="right" style="padding:8px">Montant</th></tr>
  ${rows}
  ${line('Montant du bois', m(o.wood_subtotal))}
  ${o.volume_discount > 0 ? line('dont remise dégressive', `- ${m(o.volume_discount)}`) : ''}
  ${line('Frais de livraison', o.delivery_fee === 0 ? 'Offerts' : m(o.delivery_fee))}
  ${o.tax_amount > 0 ? line(s.commerce.tax_label, m(o.tax_amount)) : ''}
  ${line('Total', m(o.total_amount), true)}
  </table>`;
}

function addressBlock(o: FullOrder) {
  const a = o.address;
  if (!a) return '';
  return `<p style="margin:0;line-height:1.6">${esc(a.line1)}${a.line2 ? `<br>${esc(a.line2)}` : ''}<br>${esc(`${a.postal_code} ${a.city}`.trim())}<br>${esc(a.country)}<br>
  <span style="color:#777">Zone : ${esc(o.delivery_zone_name)}</span>${o.desired_delivery_date ? `<br><span style="color:#777">Date souhaitée : ${esc(o.desired_delivery_date)}</span>` : ''}</p>`;
}

function demoBanner(o: FullOrder) {
  return o.is_demo
    ? `<p style="background:#FFF4E5;border:1px solid #F47A08;border-radius:8px;padding:10px 12px;font-size:13px;color:#8a3d00"><strong>Mode démonstration :</strong> prix/frais de démonstration et aucun encaissement réel.</p>`
    : '';
}

const orderLink = (o: FullOrder) => `${siteUrl()}/commande/confirmation?order=${encodeURIComponent(o.order_number)}&t=${encodeURIComponent(o.access_token)}`;
const payLink = (o: FullOrder) => `${siteUrl()}/commande/paiement?order=${encodeURIComponent(o.order_number)}&t=${encodeURIComponent(o.access_token)}`;
const trackLink = (o: FullOrder) => `${siteUrl()}/suivi?order=${encodeURIComponent(o.order_number)}`;
const adminLink = (o: FullOrder) => `${siteUrl()}/admin/commandes/${o.id}`;

function companyEmail(o: FullOrder, s: AllSettings, heading: string) {
  const txRef = o.payment?.transaction_ref || o.transactions.find((t) => t.status === 'succeeded')?.provider_tx_id || '—';
  const body = `
  <h1 style="font-family:Georgia,serif;color:#073B19;font-size:22px;margin:0 0 6px">${esc(heading)}</h1>
  <p style="color:#555;margin:0 0 16px">Commande <strong>${esc(o.order_number)}</strong> · ${esc(fmtDate(o.created_at))}</p>
  ${demoBanner(o)}
  <table role="presentation" width="100%" style="font-size:14px;line-height:1.7">
    <tr><td style="color:#777;width:170px">Client</td><td><strong>${esc(o.customer_first_name)} ${esc(o.customer_last_name)}</strong></td></tr>
    <tr><td style="color:#777">Téléphone</td><td>${esc(o.customer_phone)}</td></tr>
    <tr><td style="color:#777">E-mail</td><td>${esc(o.customer_email)}</td></tr>
    <tr><td style="color:#777">Statut paiement</td><td><strong>${esc(PAYMENT_STATUSES[o.payment_status])}</strong></td></tr>
    <tr><td style="color:#777">Statut commande</td><td>${esc(ORDER_STATUSES[o.status])}</td></tr>
    <tr><td style="color:#777">Réf. transaction</td><td>${esc(txRef)}</td></tr>
  </table>
  <h3 style="color:#073B19;margin:18px 0 6px">Adresse de livraison</h3>${addressBlock(o)}
  ${o.delivery_instructions ? `<h3 style="color:#073B19;margin:18px 0 6px">Instructions de livraison</h3><p style="margin:0">${esc(o.delivery_instructions)}</p>` : ''}
  ${orderTable(o, s)}
  ${button(adminLink(o), 'Ouvrir dans l\'administration', '#073B19')}`;
  return layout(s, heading, `${o.order_number} — ${o.customer_first_name} ${o.customer_last_name}`, body);
}

function companyText(o: FullOrder, heading: string) {
  return `${heading}
Commande ${o.order_number} (${fmtDate(o.created_at)})
Client : ${o.customer_first_name} ${o.customer_last_name} — ${o.customer_phone} — ${o.customer_email}
Livraison : ${o.address?.line1 ?? ''}, ${o.address?.city ?? ''}, ${o.address?.country ?? ''} (zone ${o.delivery_zone_name})
Instructions : ${o.delivery_instructions || '—'}
${o.items.map((i) => `- ${i.product_name} : ${formatQty(i.quantity_kg)} x ${i.unit_price_kg}/kg = ${i.line_total}`).join('\n')}
Bois : ${o.wood_subtotal} | Livraison : ${o.delivery_fee ?? 'sur devis'} | Total : ${o.total_amount ?? 'sur devis'} ${o.currency}
Paiement : ${PAYMENT_STATUSES[o.payment_status]} — Réf. ${o.payment?.transaction_ref ?? '—'}
Administration : ${adminLink(o)}`;
}

// ------------------------------------------------------------------ envois
export async function sendOrderCreatedEmails(orderId: number) {
  const [o, s] = await Promise.all([getFullOrder({ id: orderId }), getSettings()]);
  if (!o) return;
  const inbox = orderInbox(s);
  const heading = o.status === 'awaiting_quote' ? 'Nouvelle commande — livraison à chiffrer' : 'Nouvelle commande — en attente de paiement';
  if (inbox) {
    await sendMail({ to: inbox, subject: `[${s.company.name}] ${heading} · ${o.order_number}`, html: companyEmail(o, s, heading),
      text: companyText(o, heading), template: 'order_created_company', orderId, replyTo: o.customer_email });
  }
  const isQuote = o.status === 'awaiting_quote';
  const body = `
  <h1 style="font-family:Georgia,serif;color:#073B19;font-size:22px;margin:0 0 8px">Merci ${esc(o.customer_first_name)}, votre commande est enregistrée</h1>
  <p style="color:#555">Numéro de commande : <strong>${esc(o.order_number)}</strong> · Devis ${esc(o.quote_number)}</p>
  ${demoBanner(o)}
  ${isQuote
    ? `<p>Votre zone de livraison nécessite un <strong>calcul des frais par notre équipe</strong>. Nous revenons vers vous rapidement avec le montant définitif ; vous pourrez alors payer en ligne en toute sécurité.</p>`
    : `<p>Votre commande attend son règlement. Vous pouvez payer à tout moment via le lien sécurisé ci-dessous.</p>${button(payLink(o), 'Payer ma commande')}`}
  ${orderTable(o, s)}
  <h3 style="color:#073B19;margin:18px 0 6px">Adresse de livraison</h3>${addressBlock(o)}
  ${button(trackLink(o), 'Suivre ma commande', '#073B19')}`;
  await sendMail({
    to: o.customer_email,
    subject: isQuote ? `Votre commande ${o.order_number} — frais de livraison en cours de calcul` : `Votre commande ${o.order_number} est enregistrée`,
    html: layout(s, 'Commande enregistrée', `Commande ${o.order_number}`, body),
    text: `Merci ${o.customer_first_name}. Commande ${o.order_number} enregistrée. ${isQuote ? 'Frais de livraison en cours de calcul.' : `Paiement : ${payLink(o)}`}\nSuivi : ${trackLink(o)}`,
    template: 'order_created_customer', orderId, replyTo: s.company.email || undefined,
  });
}

export async function sendPaymentConfirmedEmails(orderId: number) {
  const [o, s] = await Promise.all([getFullOrder({ id: orderId }), getSettings()]);
  if (!o || o.payment_status !== 'paid') return;
  let attachment: { filename: string; content: Buffer; contentType: string } | undefined;
  try {
    const pdf = await buildReceiptPdf(o, s);
    attachment = { filename: `recu-${o.receipt?.receipt_number ?? o.order_number}.pdf`, content: Buffer.from(pdf), contentType: 'application/pdf' };
  } catch (e) {
    console.error('[pdf] génération impossible', (e as Error).message);
  }
  const inbox = orderInbox(s);
  const heading = o.is_demo ? 'Commande payée (DÉMONSTRATION)' : 'Commande payée — à préparer';
  if (inbox) {
    await sendMail({ to: inbox, subject: `[${s.company.name}] ${heading} · ${o.order_number} · ${formatMoney(o.total_amount ?? 0, o.currency)}`,
      html: companyEmail(o, s, heading), text: companyText(o, heading), template: 'payment_confirmed_company', orderId,
      replyTo: o.customer_email, attachments: attachment ? [attachment] : undefined });
  }
  const body = `
  <h1 style="font-family:Georgia,serif;color:#073B19;font-size:22px;margin:0 0 8px">Paiement confirmé ✅</h1>
  <p>Bonjour ${esc(o.customer_first_name)}, nous avons bien reçu votre paiement de <strong>${esc(formatMoney(o.total_amount ?? 0, o.currency, s.commerce.locale))}</strong>
  pour la commande <strong>${esc(o.order_number)}</strong>. Votre reçu PDF est joint à cet e-mail.</p>
  ${demoBanner(o)}
  ${orderTable(o, s)}
  <h3 style="color:#073B19;margin:18px 0 6px">Livraison</h3>${addressBlock(o)}
  <p style="color:#555">Notre équipe prépare votre bois. Vous recevrez une notification à chaque étape.</p>
  ${button(trackLink(o), 'Suivre ma commande')}
  <p style="font-size:13px;color:#777">Reçu disponible à tout moment : <a href="${esc(orderLink(o))}" style="color:#073B19">votre récapitulatif de commande</a>.</p>`;
  await sendMail({
    to: o.customer_email,
    subject: `Paiement confirmé — commande ${o.order_number}`,
    html: layout(s, 'Paiement confirmé', `Reçu ${o.receipt?.receipt_number ?? ''}`, body),
    text: `Paiement confirmé pour la commande ${o.order_number} : ${o.total_amount} ${o.currency}. Reçu joint.\nSuivi : ${trackLink(o)}`,
    template: 'payment_confirmed_customer', orderId, replyTo: s.company.email || undefined,
    attachments: attachment ? [attachment] : undefined,
  });
}

export async function sendQuoteReadyEmail(orderId: number) {
  const [o, s] = await Promise.all([getFullOrder({ id: orderId }), getSettings()]);
  if (!o) return;
  const body = `
  <h1 style="font-family:Georgia,serif;color:#073B19;font-size:22px;margin:0 0 8px">Votre devis est prêt</h1>
  <p>Bonjour ${esc(o.customer_first_name)}, les frais de livraison de votre commande <strong>${esc(o.order_number)}</strong> ont été établis.
  Vous pouvez maintenant régler votre commande en ligne.</p>
  ${orderTable(o, s)}
  ${button(payLink(o), 'Voir le devis et payer')}`;
  await sendMail({ to: o.customer_email, subject: `Devis prêt — commande ${o.order_number}`, html: layout(s, 'Devis prêt', o.order_number, body),
    text: `Devis prêt pour ${o.order_number}. Total : ${o.total_amount} ${o.currency}. Payer : ${payLink(o)}`, template: 'quote_ready_customer', orderId });
}

export async function sendStatusUpdateEmail(orderId: number, note: string) {
  const [o, s] = await Promise.all([getFullOrder({ id: orderId }), getSettings()]);
  if (!o) return;
  const body = `
  <h1 style="font-family:Georgia,serif;color:#073B19;font-size:22px;margin:0 0 8px">${esc(ORDER_STATUSES[o.status])}</h1>
  <p>Bonjour ${esc(o.customer_first_name)}, le statut de votre commande <strong>${esc(o.order_number)}</strong> a évolué :
  <strong>${esc(ORDER_STATUSES[o.status])}</strong>.</p>
  ${note ? `<p style="background:#F6F1E8;border-radius:8px;padding:12px">${esc(note)}</p>` : ''}
  ${button(trackLink(o), 'Suivre ma commande')}`;
  await sendMail({ to: o.customer_email, subject: `Commande ${o.order_number} : ${ORDER_STATUSES[o.status]}`,
    html: layout(s, 'Suivi de commande', ORDER_STATUSES[o.status], body), text: `${ORDER_STATUSES[o.status]} — ${note}\n${trackLink(o)}`,
    template: `status_${o.status}_customer`, orderId });
}

export async function sendPasswordResetEmail(to: string, link: string) {
  const s = await getSettings();
  const body = `<h1 style="font-family:Georgia,serif;color:#073B19;font-size:22px">Réinitialisation du mot de passe</h1>
  <p>Vous avez demandé à réinitialiser votre mot de passe. Ce lien est valable 1 heure.</p>${button(link, 'Choisir un nouveau mot de passe')}
  <p style="color:#777;font-size:13px">Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>`;
  await sendMail({ to, subject: `${s.company.name} — réinitialisation du mot de passe`, html: layout(s, 'Mot de passe', 'Réinitialisation', body),
    text: `Réinitialisez votre mot de passe (valable 1 h) : ${link}`, template: 'password_reset' });
}

export async function sendContactEmail(m: { name: string; email: string; phone: string; subject: string; message: string }) {
  const s = await getSettings();
  const inbox = orderInbox(s);
  if (!inbox) return;
  const body = `<h1 style="font-family:Georgia,serif;color:#073B19;font-size:22px">Nouveau message de contact</h1>
  <p><strong>${esc(m.name)}</strong> · ${esc(m.email)}${m.phone ? ` · ${esc(m.phone)}` : ''}</p>
  <p><strong>Sujet :</strong> ${esc(m.subject || '—')}</p><p style="white-space:pre-wrap;background:#F6F1E8;border-radius:8px;padding:12px">${esc(m.message)}</p>`;
  await sendMail({ to: inbox, subject: `[${s.company.name}] Contact : ${m.subject || m.name}`, html: layout(s, 'Contact', m.subject, body),
    text: `${m.name} <${m.email}> ${m.phone}\n${m.subject}\n\n${m.message}`, template: 'contact_message', replyTo: m.email });
}

/** Renvoi manuel depuis l'administration. */
export async function resendOrderEmails(orderId: number) {
  const o = await getFullOrder({ id: orderId });
  if (!o) return;
  if (o.payment_status === 'paid') await sendPaymentConfirmedEmails(orderId);
  else await sendOrderCreatedEmails(orderId);
}
