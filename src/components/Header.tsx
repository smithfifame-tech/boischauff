'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight, Mail, MapPin, Menu, Phone, ShoppingCart, User, X } from 'lucide-react';
import { Brand } from './Logo';
import { useSite } from './SiteProvider';

const NAV = [
  { href: '/', label: 'Accueil' },
  { href: '/boutique', label: 'Boutique' },
  { href: '/devis', label: 'Commander' },
  { href: '/suivi', label: 'Suivi commande' },
  { href: '/a-propos', label: 'À propos' },
  { href: '/contact', label: 'Contact' },
];

export function Header({ name, tagline, logoUrl, loggedIn }: { name: string; tagline: string; logoUrl: string; loggedIn: boolean }) {
  const { company, count } = useSite();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [open]);
  const isActive = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));
  const phoneHref = company.phone ? `tel:${company.phone.replace(/[^+\d]/g, '')}` : undefined;

  return (
    <>
      <div className="topbar">
        <div className="container">
          <div className="topbar-info">
            {company.phone && <a href={phoneHref}><Phone size={15} aria-hidden /> {company.phone}</a>}
            {company.email && <a href={`mailto:${company.email}`} className="hide-sm"><Mail size={15} aria-hidden /> {company.email}</a>}
            {company.deliveryArea && <span className="hide-sm"><MapPin size={15} aria-hidden /> {company.deliveryArea}</span>}
          </div>
          <div className="topbar-actions">
            <Link href={loggedIn ? '/compte' : '/compte/connexion'}><User size={15} aria-hidden /> <span className="hide-sm">Mon compte</span></Link>
            <Link href="/panier" className="cart-pill" aria-label={`Panier : ${count} article(s)`}>
              <ShoppingCart size={18} aria-hidden />
              {count > 0 && <span key={count} className="cart-badge">{count}</span>}
            </Link>
          </div>
        </div>
      </div>
      <header className="header">
        <div className="container">
          <Link href="/" aria-label={`${name} — accueil`}><Brand name={name} tagline={tagline} logoUrl={logoUrl} /></Link>
          <nav className="nav" aria-label="Navigation principale">
            {NAV.map((n) => <Link key={n.href} href={n.href} className={isActive(n.href) ? 'active' : ''}>{n.label}</Link>)}
          </nav>
          <Link href="/devis" className="btn btn-primary header-cta">Commander maintenant <ArrowRight size={18} aria-hidden /></Link>
          <div className="header-actions">
            <Link href="/panier" className="header-cart" aria-label={`Panier : ${count} article(s)`}>
              <ShoppingCart size={22} aria-hidden />
              {count > 0 && <span key={count} className="cart-badge">{count}</span>}
            </Link>
            <button className="menu-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-nav" aria-label="Menu">
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        <div id="mobile-nav" className={`mobile-nav${open ? ' open' : ''}`}>
          {NAV.map((n) => <Link key={n.href} href={n.href} className={isActive(n.href) ? 'active' : ''}>{n.label}</Link>)}
          <Link href="/panier">Panier {count > 0 ? `(${count})` : ''}</Link>
          <Link href={loggedIn ? '/compte' : '/compte/connexion'}>Mon compte</Link>
          <Link href="/devis" className="btn btn-primary btn-block" style={{ marginTop: 20, borderBottom: 0, color: '#fff' }}>Commander maintenant</Link>
        </div>
      </header>
    </>
  );
}
