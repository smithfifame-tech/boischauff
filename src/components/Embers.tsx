/** Braises qui s'élèvent (positions déterministes : aucun écart serveur / navigateur). */
export function Embers({ count = 26 }: { count?: number }) {
  const items = Array.from({ length: count }, (_, i) => {
    const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
    return {
      left: `${Math.round(r(1) * 100)}%`,
      s: `${3 + Math.round(r(2) * 5)}px`,
      t: `${7 + Math.round(r(3) * 8)}s`,
      dl: `${(r(4) * 10).toFixed(2)}s`,
      x: `${Math.round(r(5) * 160 - 80)}px`,
    };
  });
  return (
    <div className="embers" aria-hidden>
      {items.map((e, i) => (
        <span key={i} className="ember" style={{ left: e.left, ['--s' as string]: e.s, ['--t' as string]: e.t, ['--dl' as string]: e.dl, ['--x' as string]: e.x }} />
      ))}
    </div>
  );
}
