'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw } from 'lucide-react';
import { api } from '@/lib/client';

export function RetryEmailButton({ logId }: { logId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return (
    <>
      <button className="btn btn-ghost btn-sm" disabled={busy} onClick={async () => {
        setBusy(true); setErr('');
        try { await api('/api/admin/emails/retry', { body: { logId } }); router.refresh(); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
      }}>{busy ? <Loader2 size={15} className="spin" /> : <RefreshCw size={15} />} Réessayer</button>
      {err && <div className="field-error">{err}</div>}
    </>
  );
}
