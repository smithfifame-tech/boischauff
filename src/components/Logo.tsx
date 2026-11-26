import { LOGO_COLORS, LOGO_LOG_ENDS, LOGO_PATHS } from '@/lib/logo';

export function LogoMark({ size = 52, title }: { size?: number; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role={title ? 'img' : 'presentation'} aria-label={title} aria-hidden={title ? undefined : true}>
      <path d={LOGO_PATHS.logLeft} fill={LOGO_COLORS.log} />
      <path d={LOGO_PATHS.logRight} fill={LOGO_COLORS.log} />
      {LOGO_LOG_ENDS.map((e, i) => (
        <g key={i}>
          <circle cx={e.cx} cy={e.cy} r={e.r} fill={LOGO_COLORS.logEnd} />
          <circle cx={e.cx} cy={e.cy} r={e.r * 0.5} fill="none" stroke={LOGO_COLORS.log} strokeWidth="0.8" opacity=".6" />
        </g>
      ))}
      <path className="flame-outer" d={LOGO_PATHS.flameOuter} fill={LOGO_COLORS.flame} />
      <path className="flame-inner" d={LOGO_PATHS.flameInner} fill={LOGO_COLORS.flameInner} />
    </svg>
  );
}

/** Logo complet : flamme + nom. Le nom "BoisChauff+" est mis en couleur (partie après "Bois"). */
export function Brand({ name, tagline, logoUrl, size = 52 }: { name: string; tagline?: string; logoUrl?: string; size?: number }) {
  const m = /^(Bois)(.+)$/.exec(name);
  return (
    <span className="brand">
      {logoUrl
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={logoUrl} alt="" width={size} height={size} style={{ width: size, height: size, objectFit: 'contain' }} />
        : <LogoMark size={size} />}
      <span>
        <span className="brand-name">{m ? <>{m[1]}<em>{m[2]}</em></> : name}</span>
        {tagline ? <span className="brand-tagline">{tagline}</span> : null}
      </span>
    </span>
  );
}
