import 'server-only';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { FullOrder } from './orders';
import type { AllSettings } from './settings';
import { formatMoney, formatQty } from './pricing';
import { LOGO_COLORS, LOGO_LOG_ENDS, LOGO_PATHS } from './logo';

/** Les polices standard PDF (WinAnsi) n'acceptent pas certains caractères Unicode. */
function safe(s: string): string {
  return String(s ?? '')
    .replace(/[    ]/g, ' ')
    .replace(/[≈]/g, '~')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x20-\x7E\xA0-\xFF€’“”–—•…]/g, '');
}

function hex(c: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(c.trim());
  const v = m ? m[1] : '073B19';
  return rgb(parseInt(v.slice(0, 2), 16) / 255, parseInt(v.slice(2, 4), 16) / 255, parseInt(v.slice(4, 6), 16) / 255);
}

function drawLogo(page: PDFPage, x: number, yTop: number, size: number) {
  const scale = size / 64;
  page.drawSvgPath(LOGO_PATHS.logLeft, { x, y: yTop, scale, color: hex(LOGO_COLORS.log) });
  page.drawSvgPath(LOGO_PATHS.logRight, { x, y: yTop, scale, color: hex(LOGO_COLORS.log) });
  for (const e of LOGO_LOG_ENDS) {
    page.drawCircle({ x: x + e.cx * scale, y: yTop - e.cy * scale, size: e.r * scale, color: hex(LOGO_COLORS.logEnd) });
  }
  page.drawSvgPath(LOGO_PATHS.flameOuter, { x, y: yTop, scale, color: hex(LOGO_COLORS.flame) });
  page.drawSvgPath(LOGO_PATHS.flameInner, { x, y: yTop, scale, color: hex(LOGO_COLORS.flameInner) });
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = safe(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

const fmtDate = (d: Date | string | null) =>
  d ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Africa/Porto-Novo' }) : '';

export async function buildReceiptPdf(order: FullOrder, settings: AllSettings): Promise<Uint8Array> {
  const c = settings.company;
  const money = (v: number | null) => safe(formatMoney(v ?? 0, order.currency, settings.commerce.locale));
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Reçu ${order.receipt?.receipt_number ?? ''} — ${c.name}`);
  pdf.setAuthor(c.name);
  pdf.setCreator(c.name);
  const page = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const green = hex(c.primary_color);
  const orange = hex(c.accent_color);
  const grey = rgb(0.35, 0.37, 0.4);
  const light = rgb(0.965, 0.945, 0.91);
  const W = 595.28, M = 44;
  let y = 841.89;

  const text = (s: string, x: number, yy: number, o: { size?: number; f?: PDFFont; color?: ReturnType<typeof rgb> } = {}) =>
    page.drawText(safe(s), { x, y: yy, size: o.size ?? 10, font: o.f ?? font, color: o.color ?? rgb(0.1, 0.1, 0.1) });
  const right = (s: string, xr: number, yy: number, o: { size?: number; f?: PDFFont; color?: ReturnType<typeof rgb> } = {}) => {
    const f = o.f ?? font, size = o.size ?? 10;
    text(s, xr - f.widthOfTextAtSize(safe(s), size), yy, o);
  };

  // En-tête
  page.drawRectangle({ x: 0, y: y - 120, width: W, height: 120, color: green });
  page.drawRectangle({ x: 0, y: y - 124, width: W, height: 4, color: orange });
  page.drawCircle({ x: M + 30, y: y - 60, size: 34, color: rgb(1, 1, 1) });
  drawLogo(page, M + 8, y - 36, 44);
  text(c.name, M + 76, y - 52, { size: 22, f: bold, color: rgb(1, 1, 1) });
  text(c.tagline, M + 76, y - 70, { size: 10, color: rgb(1, 0.79, 0.16) });
  const contact = [c.phone, c.email, c.address].filter(Boolean).join('  •  ');
  text(contact, M + 76, y - 88, { size: 8.5, color: rgb(0.9, 0.93, 0.9) });
  right('REÇU DE PAIEMENT', W - M, y - 50, { size: 14, f: bold, color: rgb(1, 1, 1) });
  right(`N° ${order.receipt?.receipt_number ?? '-'}`, W - M, y - 68, { size: 10, color: rgb(1, 1, 1) });
  y -= 150;

  // Tampon PAYÉ
  const stamp = order.receipt?.is_demo || order.is_demo ? 'PAYÉ — DÉMO' : 'PAYÉ';
  const sw = bold.widthOfTextAtSize(safe(stamp), 18) + 28;
  page.drawRectangle({ x: W - M - sw, y: y - 8, width: sw, height: 32, borderColor: rgb(0.1, 0.55, 0.25), borderWidth: 2.5, color: rgb(0.92, 0.98, 0.93) });
  text(stamp, W - M - sw + 14, y + 2, { size: 18, f: bold, color: rgb(0.1, 0.55, 0.25) });

  // Infos commande
  const info: [string, string][] = [
    ['Commande', order.order_number],
    ['Devis', order.quote_number],
    ['Date de commande', fmtDate(order.created_at)],
    ['Date de paiement', fmtDate(order.paid_at)],
    ['Moyen de paiement', order.payment?.provider === 'demo' ? 'Démonstration (aucun encaissement)' : `SaaSPay${order.payment?.method ? ` — ${order.payment.method}` : ''}`],
    ['Référence transaction', order.payment?.transaction_ref ?? '-'],
  ];
  let iy = y + 10;
  for (const [k, v] of info) {
    text(k, M, iy, { size: 9, color: grey });
    text(v, M + 120, iy, { size: 9.5, f: bold });
    iy -= 15;
  }
  y = iy - 14;

  // Client / livraison
  page.drawRectangle({ x: M, y: y - 92, width: W - 2 * M, height: 100, color: light });
  text('CLIENT', M + 14, y - 10, { size: 8.5, f: bold, color: orange });
  text(`${order.customer_first_name} ${order.customer_last_name}`, M + 14, y - 26, { size: 10.5, f: bold });
  text(order.customer_email, M + 14, y - 41, { size: 9.5 });
  text(order.customer_phone, M + 14, y - 55, { size: 9.5 });
  const col2 = M + (W - 2 * M) / 2;
  text('ADRESSE DE LIVRAISON', col2, y - 10, { size: 8.5, f: bold, color: orange });
  const addr = order.address;
  const addrLines = addr ? [addr.line1, addr.line2, `${addr.postal_code} ${addr.city}`.trim(), addr.country].filter(Boolean) : [];
  addrLines.push(`Zone : ${order.delivery_zone_name}`);
  let ay = y - 26;
  for (const l of addrLines.slice(0, 5)) {
    for (const wl of wrap(l, font, 9.5, (W - 2 * M) / 2 - 20).slice(0, 2)) { text(wl, col2, ay, { size: 9.5 }); ay -= 13; }
  }
  y -= 120;

  // Tableau des produits
  const cols = { name: M + 10, qty: M + 250, unit: M + 345, total: W - M - 10 };
  page.drawRectangle({ x: M, y: y - 8, width: W - 2 * M, height: 24, color: green });
  text('Produit', cols.name, y, { size: 9, f: bold, color: rgb(1, 1, 1) });
  text('Quantité', cols.qty, y, { size: 9, f: bold, color: rgb(1, 1, 1) });
  text('Prix unitaire', cols.unit, y, { size: 9, f: bold, color: rgb(1, 1, 1) });
  right('Montant', cols.total, y, { size: 9, f: bold, color: rgb(1, 1, 1) });
  y -= 28;
  for (const it of order.items) {
    text(it.product_name, cols.name, y, { size: 10, f: bold });
    text(it.pricing_label, cols.name, y - 12, { size: 8, color: grey });
    text(formatQty(it.quantity_kg), cols.qty, y, { size: 10 });
    text(`${money(it.unit_price_kg)} / kg`, cols.unit, y, { size: 10 });
    right(money(it.line_total), cols.total, y, { size: 10, f: bold });
    y -= 30;
    page.drawLine({ start: { x: M, y: y + 12 }, end: { x: W - M, y: y + 12 }, thickness: 0.5, color: rgb(0.88, 0.88, 0.88) });
  }

  // Totaux
  y -= 6;
  const totals: [string, string, boolean?][] = [['Montant du bois', money(order.wood_subtotal)]];
  if (order.volume_discount > 0) totals.push(['dont remise dégressive', `- ${money(order.volume_discount)}`]);
  totals.push(['Frais de livraison', order.delivery_fee === 0 ? 'Offerts' : money(order.delivery_fee)]);
  if (order.tax_amount > 0) totals.push([`${settings.commerce.tax_label} (${(order.tax_rate * 100).toLocaleString('fr-FR')} %)`, money(order.tax_amount)]);
  if (order.discount_amount > 0) totals.push(['Réduction', `- ${money(order.discount_amount)}`]);
  for (const [k, v] of totals) {
    text(k, W - M - 230, y, { size: 10, color: grey });
    right(v, W - M - 10, y, { size: 10 });
    y -= 17;
  }
  y -= 12;
  page.drawRectangle({ x: W - M - 240, y: y - 12, width: 240, height: 32, color: orange });
  text('TOTAL PAYÉ', W - M - 228, y, { size: 11, f: bold, color: rgb(1, 1, 1) });
  right(money(order.total_amount), W - M - 10, y, { size: 13, f: bold, color: rgb(1, 1, 1) });
  y -= 52;

  if (order.receipt?.is_demo || order.is_demo) {
    for (const l of wrap('Reçu généré en MODE DÉMONSTRATION : aucun paiement réel n\'a été encaissé. Les prix et frais affichés sont des valeurs de démonstration.', bold, 9, W - 2 * M)) {
      text(l, M, y, { size: 9, f: bold, color: rgb(0.75, 0.25, 0.05) }); y -= 13;
    }
    y -= 6;
  }

  // Remerciements & pied de page
  text(`Merci pour votre commande, ${order.customer_first_name} !`, M, y, { size: 12, f: bold, color: green });
  y -= 16;
  for (const l of wrap(settings.receipt.footer, font, 9.5, W - 2 * M)) { text(l, M, y, { size: 9.5, color: grey }); y -= 13; }
  if (settings.receipt.legal_mentions) {
    let ly = 110;
    for (const l of wrap(settings.receipt.legal_mentions, font, 8, W - 2 * M).slice(0, 5)) { text(l, M, ly, { size: 8, color: grey }); ly -= 11; }
  }
  page.drawLine({ start: { x: M, y: 52 }, end: { x: W - M, y: 52 }, thickness: 0.6, color: rgb(0.85, 0.85, 0.85) });
  text(`${c.name} — ${c.delivery_area}`, M, 38, { size: 8, color: grey });
  right(`Émis le ${fmtDate(order.receipt?.issued_at ?? new Date())}`, W - M, 38, { size: 8, color: grey });

  return pdf.save();
}
