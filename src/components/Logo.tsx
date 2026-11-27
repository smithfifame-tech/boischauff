import { LOGO_COLORS, LOGO_PATHS } from '@/lib/logo';

export function LogoMark({ size = 52, title }: { size?: number; title?: string }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 64 64" role={title ? 'img' : 'presentation'} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <linearGradient id="gwGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={LOGO_COLORS.light} /><stop offset="1" stopColor={LOGO_COLORS.deep} />
        </linearGradient>
      </defs>
      <g className="logo-tree">
        <path d={LOGO_PATHS.canopy} fill="url(#gwGold)" />
        <path d={LOGO_PATHS.leaves} fill={LOGO_COLORS.glow} opacity=".75" />
      </g>
      <path d={LOGO_PATHS.trunk} fill={LOGO_COLORS.deep} />
      <path d={LOGO_PATHS.roof} fill="url(#gwGold)" />
      <path d={LOGO_PATHS.walls} fill={LOGO_COLORS.gold} />
      <path className="logo-window" d={LOGO_PATHS.window} fill={LOGO_COLORS.glow} />
      <path d={LOGO_PATHS.ground} fill={LOGO_COLORS.deep} />
    </svg>
  );
}

/** Logo complet : arbre + nom. Pour « GodenWood », « Goden » est doré et « Wood » blanc. */
export function Brand({ name, tagline, logoUrl, size = 58 }: { name: string; tagline?: string; logoUrl?: string; size?: number }) {
  const m = /^(Goden)(Wood.*)$/.exec(name) ?? /^(Bois)(.+)$/.exec(name);
  return (
    <span className="brand">
      {logoUrl
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={logoUrl} alt="" width={size} height={size} style={{ width: size, height: size, objectFit: 'contain' }} />
        : <LogoMark size={size} />}
      <span>
        <span className="brand-name">{m ? <><em>{m[1]}</em>{m[2]}</> : name}</span>
        {tagline ? <span className="brand-tagline">{tagline}</span> : null}
      </span>
    </span>
  );
}
