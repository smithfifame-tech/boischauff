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

export const PHOTOS = {
  hero: 'https://images.unsplash.com/photo-1592751854100-135b9021364c',
  truck: 'https://images.unsplash.com/photo-1549624523-8b6241ac724b',
  forest: 'https://images.unsplash.com/photo-1615836671441-cc13250c2158',
  logs: 'https://images.unsplash.com/photo-1583095117095-adaeabc401ab',
  fire: 'https://images.unsplash.com/photo-1464747108843-cec40b4f0157',
  stack: 'https://images.unsplash.com/photo-1571040195944-85a412548a43',
};
export const PHOTO_CREDITS = [
  'Sergio Lapunin', 'Krzysztof Kowalik', 'Timo C. Dinger', 'Etienne Girardet', 'Obed Hernández', 'Andreas Pajuvirta',
  'Kto.to. Radek', 'Hans', 'Patrick Tomasso', 'Clay Banks', 'Patrick Robert Doyle',
];
