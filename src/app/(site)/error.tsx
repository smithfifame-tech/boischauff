'use client';
import { AlertTriangle } from 'lucide-react';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="section"><div className="container empty-state">
      <AlertTriangle size={52} aria-hidden />
      <h1>Un incident est survenu</h1>
      <p className="hint">Le service est momentanément indisponible. Merci de réessayer dans un instant.</p>
      <button className="btn btn-primary" onClick={reset}>Réessayer</button>
    </div></section>
  );
}
