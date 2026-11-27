import 'server-only';
import postgres from 'postgres';

declare global {
  // eslint-disable-next-line no-var
  var __bcSql: ReturnType<typeof postgres> | undefined;
}

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL manquant : configurez la base de données (voir .env.example).');
  }
  const isLocal = /@(localhost|127\.0\.0\.1)|host=\/|%2Ftmp/.test(url);
  // Pooler Supabase : le mode transaction (port 6543) bloque les requêtes paramétrées de postgres.js
  // (Describe + Flush sans Sync). On utilise le mode session (port 5432) du même pooler, sauf si
  // DATABASE_POOL_MODE=transaction est explicitement demandé.
  let finalUrl = url;
  let session = false;
  try {
    const u = new URL(url);
    if (u.hostname.endsWith('pooler.supabase.com') && u.port === '6543' && process.env.DATABASE_POOL_MODE !== 'transaction') {
      u.port = '5432';
      finalUrl = u.toString();
      session = true;
    }
  } catch { /* URL non standard : utilisée telle quelle */ }
  const transactionPooler = !session && /:6543\b|pgbouncer=true/.test(url);
  const options = {
    // Requêtes préparées seulement hors pooler en mode transaction
    prepare: !transactionPooler,
    max: Number(process.env.DATABASE_POOL_MAX || (session ? 3 : 5)),
    max_pipeline: transactionPooler ? 1 : 100,
    idle_timeout: 20,
    connect_timeout: 15,
    ssl: isLocal || process.env.DATABASE_SSL === 'disable' ? false : 'require',
    // Toutes les tables vivent dans le schéma "boischauff"
    connection: { search_path: process.env.DATABASE_SCHEMA || 'boischauff' },
    onnotice: () => {},
  };
  // max_pipeline existe dans postgres.js mais n'est pas déclaré dans ses types.
  return postgres(finalUrl, options as unknown as Parameters<typeof postgres>[1]);
}

export function db() {
  if (!globalThis.__bcSql) globalThis.__bcSql = createClient();
  return globalThis.__bcSql;
}

export type Sql = ReturnType<typeof postgres>;

/** Convertit une valeur numeric (renvoyée en chaîne par Postgres) en nombre. */
export function num(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
