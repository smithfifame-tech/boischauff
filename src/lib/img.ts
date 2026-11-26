/** Optimise les images Unsplash (format auto, recadrage, compression) ; laisse les autres URL inchangées. */
export function img(url: string, w: number, h?: number, q = 72): string {
  if (!url) return '';
  if (!url.includes('images.unsplash.com')) return url;
  const base = url.split('?')[0];
  const params = new URLSearchParams({ auto: 'format', fit: 'crop', w: String(w), q: String(q) });
  if (h) params.set('h', String(h));
  return `${base}?${params.toString()}`;
}
export function srcSet(url: string, widths: number[], ratio?: number): string | undefined {
  if (!url.includes('images.unsplash.com')) return undefined;
  return widths.map((w) => `${img(url, w, ratio ? Math.round(w / ratio) : undefined)} ${w}w`).join(', ');
}

const U = (id: string) => `https://images.unsplash.com/photo-${id}`;
export const PHOTOS = {
  hero: U('1592751854100-135b9021364c'),
  truck: U('1549624523-8b6241ac724b'),
  flatbed: U('1763515188616-b72e33065350'),
  forest: U('1615836671441-cc13250c2158'),
  logs: U('1583095117095-adaeabc401ab'),
  fire: U('1464747108843-cec40b4f0157'),
  stack: U('1571040195944-85a412548a43'),
  shed: U('1491831718109-ffc2cb30cc38'),
  wedges: U('1475500958746-c4562f6f40f0'),
  grass: U('1629570584961-6d1ac3ded3d8'),
  bigPile: U('1485965089147-0f655dcf01b0'),
  oak: U('1617410225897-c9d260e3055e'),
  neat: U('1761655622268-3707c5467749'),
  winter: U('1643299336738-e95c332a0457'),
  birch: U('1416425816930-a02a589195d2'),
  fireplaceLogs: U('1483217067170-e62094708cd8'),
  livingRoom: U('1761319914911-71b059a655d8'),
  livingFire: U('1696814543664-3f5acf78349e'),
  cabinStove: U('1698933787104-3f91cf25909c'),
  stove: U('1678274909137-ae0677d24a9b'),
  stoveFlame: U('1648332202349-a1ca4f99ee0c'),
  axeLog: U('1444228250525-3d441b642d12'),
  axe: U('1550090598-26af8817586d'),
  splitting: U('1619207561875-53965957847e'),
  kindling: U('1634672652995-ee7525bce595'),
  texture: U('1660570328508-34840e2a80d9'),
};
export const PHOTO_CREDITS = [
  'Sergio Lapunin', 'Krzysztof Kowalik', 'Chandler Cruttenden', 'Timo C. Dinger', 'Etienne Girardet', 'Obed Hernández', 'Andreas Pajuvirta',
  'Kto.to. Radek', 'Hans', 'Patrick Tomasso', 'Clay Banks', 'Patrick Robert Doyle', 'Kelsey Todd', 'Dorelys Smits', 'Artiom Vallat',
  'Ainārs Cekuls', 'Jacob Miller', 'andre govia', 'Rhamely', 'Seiya Maeda', 'Jen Dries', 'Dan Edwards', 'Abby Savage', 'Jennifer Lim-Tamkican',
  'Stanislav Churikov', 'Chuck Danger', 'Marzena Ko',
];
