/** Numéros de téléphone : format international pour les liens tel: et WhatsApp (France par défaut). */
export function intlDigits(phone: string): string {
  const raw = phone.trim();
  let d = raw.replace(/\D/g, '');
  if (raw.startsWith('+')) return d;
  if (d.startsWith('00')) return d.slice(2);
  if (/^0[1-9]\d{8}$/.test(d)) return `33${d.slice(1)}`; // 06 12 34 56 78 → 33612345678
  return d;
}
export const telHref = (phone: string) => `tel:+${intlDigits(phone)}`;
export const waHref = (phone: string) => `https://wa.me/${intlDigits(phone)}`;
