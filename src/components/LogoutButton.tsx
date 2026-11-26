'use client';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { api } from '@/lib/client';

export function LogoutButton({ admin = false }: { admin?: boolean }) {
  const router = useRouter();
  return (
    <button type="button" className={admin ? '' : 'btn btn-ghost btn-block'} onClick={async () => {
      await api(admin ? '/api/admin/logout' : '/api/auth/logout', { method: 'POST', body: {} }).catch(() => {});
      router.push(admin ? '/admin/connexion' : '/'); router.refresh();
    }}><LogOut size={18} aria-hidden /> Se déconnecter</button>
  );
}
