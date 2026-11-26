// Applique les migrations SQL (db/migrations/*.sql) dans l'ordre.
// Usage : DATABASE_URL=postgres://… node scripts/migrate.mjs
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const url = process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL manquant'); process.exit(1); }
const local = /@(localhost|127\.0\.0\.1)|host=\//.test(url);
const sql = postgres(url, { ssl: local ? false : 'require', max: 1, prepare: false, onnotice: () => {} });
const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'db', 'migrations');
try {
  const [{ exists }] = await sql`select exists(select 1 from pg_namespace where nspname = 'boischauff') as exists`;
  if (!exists) await sql.unsafe('create schema boischauff');
  await sql.unsafe('create table if not exists boischauff.schema_migrations (name text primary key, applied_at timestamptz not null default now())');
  const done = new Set((await sql`select name from boischauff.schema_migrations`).map((r) => r.name));
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) {
    if (done.has(f)) { console.log(`✓ ${f} (déjà appliquée)`); continue; }
    await sql.begin(async (tx) => {
      // Le schéma existe déjà : on retire sa création (droit CREATE sur la base non requis)
      const ddl = readFileSync(join(dir, f), 'utf8').replace(/CREATE SCHEMA IF NOT EXISTS boischauff;/gi, '');
      await tx.unsafe(ddl);
      await tx`insert into boischauff.schema_migrations (name) values (${f})`;
    });
    console.log(`→ ${f} appliquée`);
  }
  // Administrateur initial (une seule fois, si aucun administrateur n'existe)
  const email = process.env.INITIAL_ADMIN_EMAIL;
  const hash = process.env.INITIAL_ADMIN_PASSWORD_HASH;
  if (email && hash) {
    const [{ n }] = await sql`select count(*)::int as n from boischauff.admins`;
    if (n === 0) {
      await sql`insert into boischauff.admins (email, password_hash, name, must_change_password) values (${email.toLowerCase()}, ${hash}, 'Administrateur', true)`;
      console.log(`→ administrateur initial créé : ${email}`);
    }
  }
} finally { await sql.end(); }
