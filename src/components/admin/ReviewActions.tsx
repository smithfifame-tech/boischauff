'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client';

export function ReviewActions({ id, status }: { id: number; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const act = async (body: { status: string } | null) => {
    setBusy(true);
    try { await api(`/api/admin/reviews/${id}`, body ? { method: 'PATCH', body } : { method: 'DELETE' }); router.refresh(); }
    catch (e) { alert((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {status !== 'approved' && <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => act({ status: 'approved' })}>Publier</button>}
      {status !== 'rejected' && <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => act({ status: 'rejected' })}>Refuser</button>}
    </div>
  );
}
