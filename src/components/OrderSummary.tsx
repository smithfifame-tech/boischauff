'use client';

import { Loader2 } from 'lucide-react';
import { formatQty } from '@/lib/pricing';
import type { ServerQuote } from './useServerQuote';
import { useSite } from './SiteProvider';

export function OrderSummary({ quote, loading, title = 'Récapitulatif', children }: { quote: ServerQuote | null; loading: boolean; title?: string; children?: React.ReactNode }) {
  const { money, commerce } = useSite();
  return (
    <div className="card card-pad">
      <h2 style={{ fontSize: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {title} {loading && <Loader2 size={18} className="spin" aria-label="Calcul en cours" />}
      </h2>
      {!quote ? <p className="hint">Ajoutez des produits pour voir le récapitulatif.</p> : (
        <div className="summary">
          {quote.lines.map((l) => (
            <div key={l.productId} className="summary-row" style={{ alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--ink)' }}>{l.productName}<br /><small className="hint">{formatQty(l.quantityKg)} × {money(l.unitPriceKg)}/kg</small></span>
              <strong>{l.ok ? money(l.total) : '—'}</strong>
            </div>
          ))}
          <div className="summary-row" style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}><span>Prix du bois</span><strong>{money(quote.woodSubtotal)}</strong></div>
          {quote.savings > 0 && <div className="summary-row saving"><span style={{ color: 'inherit' }}>Remise dégressive incluse</span><strong>- {money(quote.savings)}</strong></div>}
          <div className="summary-row"><span>Livraison{quote.delivery.zone ? ` (${quote.delivery.zone})` : ''}</span>
            <strong>{quote.delivery.requiresQuote ? 'Sur devis' : quote.delivery.fee === 0 ? 'Offerte' : money(quote.delivery.fee ?? 0)}</strong></div>
          {quote.tax > 0 && <div className="summary-row"><span>{commerce.taxLabel} ({(quote.taxRate * 100).toLocaleString('fr-FR')} %)</span><strong>{money(quote.tax)}</strong></div>}
          <div className="summary-row summary-total"><span style={{ color: 'var(--ink)', fontWeight: 800 }}>Total</span>
            <strong>{quote.total === null ? `${money(quote.woodSubtotal + quote.tax)} + livraison` : money(quote.total)}</strong></div>
          {quote.delivery.requiresQuote && (
            <p className="alert alert-warn" style={{ margin: 0, fontSize: '.88rem' }}>Les frais de livraison de votre zone seront calculés par notre équipe. Vous serez informé(e) du montant exact <strong>avant tout paiement</strong>.</p>
          )}
          {quote.errors.map((e) => <p key={e} className="alert alert-error" style={{ margin: 0, fontSize: '.88rem' }}>{e}</p>)}
        </div>
      )}
      {children}
    </div>
  );
}
