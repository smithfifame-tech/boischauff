'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { PublicProduct, PublicZone } from '@/lib/catalog';
import { api } from '@/lib/client';
import { formatMoney, toKg, type Unit } from '@/lib/pricing';

export interface CartItem { productId: number; quantity: number; unit: Unit }
export interface SiteCommerce { currency: string; locale: string; taxRate: number; taxLabel: string; minOrderAmount: number; guestCheckout: boolean; showDemoNotice: boolean }
export interface SiteCompany { name: string; phone: string; email: string; deliveryArea: string }

interface Ctx {
  products: PublicProduct[];
  zones: PublicZone[];
  commerce: SiteCommerce;
  company: SiteCompany;
  paymentMode: 'stripe' | 'saspay' | 'demo' | 'none';
  items: CartItem[];
  ready: boolean;
  count: number;
  add: (item: CartItem) => void;
  update: (productId: number, patch: Partial<CartItem>) => void;
  remove: (productId: number) => void;
  clear: () => void;
  money: (v: number) => string;
  zoneId: number | null;
  setZoneId: (id: number | null) => void;
}

const SiteContext = createContext<Ctx | null>(null);
const LS_KEY = 'bc_cart_v1';
const LS_ZONE = 'bc_zone_v1';

export function SiteProvider(props: {
  children: React.ReactNode; products: PublicProduct[]; zones: PublicZone[]; commerce: SiteCommerce; company: SiteCompany; paymentMode: Ctx['paymentMode'];
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [zoneId, setZoneIdState] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const skipSync = useRef(true);

  // Restauration : stockage local d'abord, puis panier serveur si le local est vide
  useEffect(() => {
    let local: CartItem[] = [];
    try { local = JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { local = []; }
    const valid = (arr: CartItem[]) => arr.filter((i) => props.products.some((p) => p.id === i.productId) && i.quantity > 0 && (i.unit === 'kg' || i.unit === 't'));
    try { const z = Number(localStorage.getItem(LS_ZONE)); if (z && props.zones.some((x) => x.id === z)) setZoneIdState(z); } catch { /* ignore */ }
    if (local.length) {
      setItems(valid(local));
      setReady(true);
    } else {
      api<{ items: CartItem[] }>('/api/cart').then((r) => setItems(valid(r.items || []))).catch(() => {}).finally(() => setReady(true));
    }
  }, [props.products, props.zones]);

  // Persistance (local + serveur, avec temporisation)
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch { /* ignore */ }
    if (skipSync.current) { skipSync.current = false; return; }
    const t = setTimeout(() => { api('/api/cart', { method: 'PUT', body: { items } }).catch(() => {}); }, 700);
    return () => clearTimeout(t);
  }, [items, ready]);

  const setZoneId = useCallback((id: number | null) => {
    setZoneIdState(id);
    try { if (id) localStorage.setItem(LS_ZONE, String(id)); else localStorage.removeItem(LS_ZONE); } catch { /* ignore */ }
  }, []);

  const add = useCallback((item: CartItem) => {
    setItems((prev) => {
      const ex = prev.find((p) => p.productId === item.productId);
      if (!ex) return [...prev, item];
      const kg = toKg(ex.quantity, ex.unit) + toKg(item.quantity, item.unit);
      const unit: Unit = ex.unit === 't' && item.unit === 't' ? 't' : 'kg';
      return prev.map((p) => (p.productId === item.productId ? { ...p, unit, quantity: unit === 't' ? kg / 1000 : kg } : p));
    });
  }, []);
  const update = useCallback((productId: number, patch: Partial<CartItem>) => {
    setItems((prev) => prev.map((p) => (p.productId === productId ? { ...p, ...patch } : p)));
  }, []);
  const remove = useCallback((productId: number) => setItems((prev) => prev.filter((p) => p.productId !== productId)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<Ctx>(() => ({
    products: props.products, zones: props.zones, commerce: props.commerce, company: props.company, paymentMode: props.paymentMode,
    items, ready, count: items.length, add, update, remove, clear, zoneId, setZoneId,
    money: (v: number) => formatMoney(v, props.commerce.currency, props.commerce.locale),
  }), [props.products, props.zones, props.commerce, props.company, props.paymentMode, items, ready, add, update, remove, clear, zoneId, setZoneId]);

  return <SiteContext.Provider value={value}>{props.children}</SiteContext.Provider>;
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite doit être utilisé dans SiteProvider');
  return ctx;
}
