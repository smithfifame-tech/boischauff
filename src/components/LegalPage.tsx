import { PageHero } from './PageHero';

export function LegalPage({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <>
      <PageHero title={title} intro={intro} />
      <section className="section"><div className="container"><div className="prose card card-pad">{children}</div></div></section>
    </>
  );
}
export function ToComplete({ children }: { children: React.ReactNode }) {
  return <mark style={{ background: '#FFF4E5', color: '#8a3d00', padding: '0 4px', borderRadius: 4 }}>[À compléter : {children}]</mark>;
}
