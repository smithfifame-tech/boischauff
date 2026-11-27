import { Star } from 'lucide-react';

/** Étoiles (lecture seule) ; demi-étoile arrondie à l'entier le plus proche pour rester lisible. */
export function Stars({ value, size = 16, count }: { value: number; size?: number; count?: number }) {
  const full = Math.round(value);
  return (
    <span className="stars" aria-label={`Note ${value.toLocaleString('fr-FR')} sur 5${count !== undefined ? `, ${count} avis` : ''}`}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={size} aria-hidden fill={i <= full ? 'currentColor' : 'none'} strokeWidth={i <= full ? 0 : 1.8} />)}
      {count !== undefined && <small>({count} avis)</small>}
    </span>
  );
}
