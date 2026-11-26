// Logo provisoire BoisChauff+ : flamme + deux bûches croisées (viewBox 64 x 64).
// Partagé entre le site (SVG) et les reçus PDF (pdf-lib drawSvgPath).
export const LOGO_PATHS = {
  logLeft: 'M6 49 L44 39 Q49 38 50 42.5 Q51 47 46 48.5 L8 58.5 Q3 59.5 2 55 Q1 50.5 6 49 Z',
  logRight: 'M58 49 L20 39 Q15 38 14 42.5 Q13 47 18 48.5 L56 58.5 Q61 59.5 62 55 Q63 50.5 58 49 Z',
  flameOuter: 'M32 3 C36.5 13 47 17.5 47 30 C47 39.5 40.5 46 32 46 C23.5 46 17 39.5 17 30 C17 22.5 21 18.5 24.5 14.5 C24.5 21 27.5 24.5 30 24.5 C28.5 17 29.5 9.5 32 3 Z',
  flameInner: 'M32 21 C34.5 26.5 40 29 40 35.5 C40 40.5 36.5 44 32 44 C27.5 44 24 40.5 24 35.5 C24 31 27 28.5 28.5 25.5 C29.5 28.5 30.5 29.5 32 29.5 C31 26.5 31 24 32 21 Z',
};
export const LOGO_COLORS = { log: '#7A4A1E', logEnd: '#D9A066', flame: '#F47A08', flameInner: '#FFC928' };
export const LOGO_LOG_ENDS = [
  { cx: 46.5, cy: 43.5, r: 4 },
  { cx: 17.5, cy: 43.5, r: 4 },
];
