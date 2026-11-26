import 'server-only';
import { getFullOrder, canAccessOrder } from './orders';
import { getCurrentAdmin, getCurrentUser } from './auth';

/** Charge une commande pour une page client : lien privé (?t=), propriétaire connecté ou admin. */
export async function loadOrderForPage(number?: string, token?: string) {
  if (!number) return null;
  const order = await getFullOrder({ number });
  if (!order) return null;
  const [user, admin] = await Promise.all([getCurrentUser().catch(() => null), getCurrentAdmin().catch(() => null)]);
  return canAccessOrder(order, { token, userId: user?.id, isAdmin: Boolean(admin) }) ? order : null;
}
