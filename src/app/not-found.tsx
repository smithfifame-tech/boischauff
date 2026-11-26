import Link from 'next/link';
export default function NotFound() {
  return (
    <main style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', textAlign: 'center', padding: 20 }}>
      <div><h1>Page introuvable</h1><p>La page demandée n&apos;existe pas.</p><Link href="/" className="btn btn-primary">Retour à l&apos;accueil</Link></div>
    </main>
  );
}
