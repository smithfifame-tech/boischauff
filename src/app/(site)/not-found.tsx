import Link from 'next/link';
import { Flame } from 'lucide-react';

export default function NotFound() {
  return (
    <section className="section"><div className="container empty-state">
      <Flame size={56} aria-hidden />
      <h1>Page introuvable</h1>
      <p className="hint">La page demandée n&apos;existe pas ou a été déplacée.</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/" className="btn btn-green">Retour à l&apos;accueil</Link>
        <Link href="/boutique" className="btn btn-primary">Voir la boutique</Link>
      </div>
    </div></section>
  );
}
