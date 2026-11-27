'use client';
import { telHref } from '@/lib/phone';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight, ChevronDown, Home, Info, Mail, MapPin, Menu, MessageSquareQuote, Phone, PackageSearch, ShoppingBag, ShoppingCart, Store, User, X } from 'lucide-react';
import { Brand } from './Logo';
import { useSite } from './SiteProvider';

const NAV = [
  { href: '/', label: 'Accueil', icon: Home },
  { href: '/boutique', label: 'Boutique', icon: Store },
  { href: '/devis', label: 'Commander', icon: ShoppingBag },
  { href: '/suivi', label: 'Suivi de commande', icon: PackageSearch },
  { href: '/a-propos', label: 'À propos', icon: Info },
  { href: '/avis', label: 'Avis', icon: MessageSquareQuote },
  { href: '/contact', label: 'Contact', icon: Mail },
];

export function Header({ name, tagline, logoUrl, loggedIn }: { name: string; tagline: string; logoUrl: string; loggedIn: boolean }) {
  const { company, count, products, money } = useSite();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [open]);
  const isActive = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));
  const phoneHref = company.phone ? telHref(company.phone) : undefined;

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
            <Link href={loggedIn ? '/compte' : '/compte/connexion'}><User size={15} aria-hidden /> <span className="hide-sm">{loggedIn ? 'Mon compte' : 'Se connecter'}</span> <ChevronDown size={14} aria-hidden className="hide-sm" /></Link>
            <Link href="/panier" className="cart-pill" aria-label={`Panier : ${count} article(s)`}>
              <ShoppingCart size={18} aria-hidden />
              <span key={count} className="cart-badge">{count}</span>
            </Link>
          </div>
        </div>
      </div>
      <header className="header">
        <div className="container">
          <Link href="/" aria-label={`${name} — accueil`}><Brand name={name} tagline={tagline} logoUrl={logoUrl} /></Link>
          <nav className="nav" aria-label="Navigation principale">
            {NAV.map((n) => n.href === '/boutique' ? (
              <div className="nav-drop" key={n.href}>
                <button type="button" aria-haspopup="true" className={isActive(n.href) ? 'active' : ''}>{n.label} <ChevronDown size={15} aria-hidden /></button>
                <div className="drop" role="menu">
                  <Link href="/boutique" role="menuitem"><strong>Toute la boutique</strong></Link>
                  {products.map((p) => <Link key={p.id} href={`/produits/${p.slug}`} role="menuitem">{p.name} <small>{money(p.base_price_per_kg)}/kg</small></Link>)}
                </div>
              </div>
            ) : (
              <Link key={n.href} href={n.href} className={isActive(n.href) ? 'active' : ''}>{n.href === '/' && <n.icon size={16} aria-hidden style={{ verticalAlign: '-2px', marginRight: 4 }} />}{n.label}</Link>
            ))}
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
          {NAV.map((n) => <Link key={n.href} href={n.href} className={isActive(n.href) ? 'active' : ''}><n.icon size={18} aria-hidden style={{ verticalAlign: '-3px', marginRight: 10, color: 'var(--orange)' }} />{n.label}</Link>)}
          <Link href="/panier">Panier {count > 0 ? `(${count})` : ''}</Link>
          <Link href={loggedIn ? '/compte' : '/compte/connexion'}>Mon compte</Link>
          <Link href="/devis" className="btn btn-primary btn-block" style={{ marginTop: 20, borderBottom: 0 }}>Commander maintenant</Link>
        </div>
      </header>
    </>
  );
}
