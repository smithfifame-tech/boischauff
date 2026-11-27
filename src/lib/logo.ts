// Logo GodenWood : arbre doré + maison (viewBox 64 x 64).
// Partagé entre le site (SVG) et les reçus PDF (pdf-lib drawSvgPath : formes pleines uniquement).
export const LOGO_PATHS = {
  canopy: 'M20 3 C27 3 31 7 31.5 12 C36.5 13 39 18 37 22.5 C39.5 27 36 32.5 29.5 32.5 L10.5 32.5 C4 32.5 0.5 27 3 22.5 C1 18 3.5 13 8.5 12 C9 7 13 3 20 3 Z',
  leaves: 'M14 14 C16 11 19 11 20 13 C17 13 15.5 14.5 14 17 Z M24 18 C27 16 30 17 30.5 19.5 C28 18.5 26 19 24 21 Z M10 23 C12.5 21 15.5 21.5 16 24 C13.5 23.5 11.5 24 10 26 Z',
  trunk: 'M18.4 32 L21.6 32 L21.2 40 L25.5 35.5 L26.8 36.8 L21.4 43 L22.4 50 C23.8 53 26.5 54.8 30 56 L10 56 C13.5 54.8 16.2 53 17.6 50 L18.3 44 L13.6 38.6 L15 37.4 L18.5 41 Z',
  roof: 'M29 34 L44.5 20 L60 34 L56.6 34 L44.5 23.2 L32.4 34 Z',
  walls: 'M35 31 L38.2 31 L38.2 52.8 L50.8 52.8 L50.8 31 L54 31 L54 56 L35 56 Z',
  window: 'M40.6 36.6 L43.9 36.6 L43.9 39.9 L40.6 39.9 Z M45.1 36.6 L48.4 36.6 L48.4 39.9 L45.1 39.9 Z M40.6 41.1 L43.9 41.1 L43.9 44.4 L40.6 44.4 Z M45.1 41.1 L48.4 41.1 L48.4 44.4 L45.1 44.4 Z',
  ground: 'M3 57.2 L61 57.2 L61 59.4 L3 59.4 Z',
};
export const LOGO_COLORS = { gold: '#F5A623', light: '#FFC542', deep: '#C98010', glow: '#FFE08A' };
