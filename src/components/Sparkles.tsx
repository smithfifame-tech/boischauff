/** Étincelles dorées scintillantes (positions déterministes). */
export function Sparkles({ count = 18 }: { count?: number }) {
  const r = (i: number, n: number) => ((Math.sin(i * 91.7 + n * 47.3) * 10000) % 1 + 1) % 1;
  return (
    <div className="sparkles" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <i key={i} style={{ left: `${Math.round(r(i, 1) * 100)}%`, top: `${Math.round(r(i, 2) * 100)}%`, ['--t' as string]: `${2 + r(i, 3) * 3}s`, ['--dl' as string]: `${(r(i, 4) * 4).toFixed(2)}s` }} />
      ))}
    </div>
  );
}
