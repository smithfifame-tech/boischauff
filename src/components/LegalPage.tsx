import { PageHero } from './PageHero';
import { PHOTOS } from '@/lib/img';

export function LegalPage({ title, intro, image = PHOTOS.texture, children }: { title: string; intro?: string; image?: string; children: React.ReactNode }) {
  return (
    <>
      <PageHero image={image} title={title} intro={intro} />
      <section className="section"><div className="container"><div className="prose card card-pad" data-reveal="up">{children}</div></div></section>
    </>
  );
}
export function ToComplete({ children }: { children: React.ReactNode }) {
  return <mark style={{ background: '#FFF4E5', color: '#8a3d00', padding: '0 4px', borderRadius: 4 }}>[À compléter : {children}]</mark>;
}
