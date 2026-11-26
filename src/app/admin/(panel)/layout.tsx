import { redirect } from 'next/navigation';
import { Brand } from '@/components/Logo';
import { AdminNav } from '@/components/admin/AdminNav';
import { getCurrentAdmin } from '@/lib/auth';
import { getSettings } from '@/lib/settings';

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [admin, s] = await Promise.all([getCurrentAdmin(), getSettings()]);
  if (!admin) redirect('/admin/connexion');
  if (admin.must_change_password) redirect('/admin/mot-de-passe');
  return (
    <div className="admin">
      <aside className="admin-side">
        <Brand name={s.company.name} logoUrl={s.company.logo_url} size={40} />
        <p style={{ fontSize: '.8rem', margin: '10px 0 0', opacity: .8 }}>{admin.email}</p>
        <AdminNav />
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
