import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Brand } from '@/components/Logo';
import { AdminLoginForm } from '@/components/admin/AdminAuth';
import { getSettings } from '@/lib/settings';

export const metadata: Metadata = { title: 'Administration — connexion', robots: { index: false, follow: false } };

export default async function AdminLogin() {
  const s = await getSettings();
  return (
    <div className="admin-login">
      <div className="card">
        <div style={{ marginBottom: 20 }}><Brand name={s.company.name} tagline="Espace administrateur" logoUrl={s.company.logo_url} /></div>
        <Suspense><AdminLoginForm /></Suspense>
      </div>
    </div>
  );
}
