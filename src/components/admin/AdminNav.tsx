'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ExternalLink, KeyRound, LayoutDashboard, Mail, MailPlus, MessageSquare, Package, Settings, ShoppingBag, Star, Truck } from 'lucide-react';
import { LogoutButton } from '../LogoutButton';

const LINKS = [
  { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { href: '/admin/commandes', label: 'Commandes', icon: ShoppingBag },
  { href: '/admin/produits', label: 'Produits', icon: Package },
  { href: '/admin/livraison', label: 'Livraison', icon: Truck },
  { href: '/admin/emails', label: 'E-mails', icon: Mail },
  { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { href: '/admin/avis', label: 'Avis clients', icon: Star },
  { href: '/admin/newsletter', label: 'Newsletter', icon: MailPlus },
  { href: '/admin/parametres', label: 'Paramètres', icon: Settings },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Administration">
      {LINKS.map(({ href, label, icon: Icon, exact }) => (
        <Link key={href} href={href} className={(exact ? path === href : path.startsWith(href)) ? 'active' : ''}><Icon size={18} aria-hidden /> {label}</Link>
      ))}
      <Link href="/admin/mot-de-passe"><KeyRound size={18} aria-hidden /> Mot de passe</Link>
      <Link href="/" target="_blank"><ExternalLink size={18} aria-hidden /> Voir le site</Link>
      <LogoutButton admin />
    </nav>
  );
}
