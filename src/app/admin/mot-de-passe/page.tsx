import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Brand } from '@/components/Logo';
import { AdminPasswordForm } from '@/components/admin/AdminAuth';
import { getCurrentAdmin } from '@/lib/auth';
import { getSettings } from '@/lib/settings';

export const metadata: Metadata = { title: 'Changer le mot de passe', robots: { index: false, follow: false } };

export default async function AdminPassword() {
  const [admin, s] = await Promise.all([getCurrentAdmin(), getSettings()]);
  if (!admin) redirect('/admin/connexion');
  return (
    <div className="admin-login">
      <div className="card">
        <div style={{ marginBottom: 20 }}><Brand name={s.company.name} tagline="Sécurité du compte" logoUrl={s.company.logo_url} /></div>
        <AdminPasswordForm forced={admin.must_change_password} />
        {!admin.must_change_password && <p style={{ textAlign: 'center', marginTop: 14 }}><Link href="/admin" className="hint">Retour au tableau de bord</Link></p>}
      </div>
    </div>
  );
}
