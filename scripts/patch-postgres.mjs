// Correctif postgres.js pour les poolers en mode transaction (Supabase Supavisor, PgBouncer).
// Avec prepare:false, postgres.js envoie Parse + Describe + Flush puis attend la réponse avant
// Bind/Execute/Sync : certains poolers ne relaient pas cette réponse et la requête reste bloquée.
// On envoie alors tout en un seul message (Parse, Describe, Bind, Execute, Sync), comme node-postgres.
import fs from 'node:fs';
import path from 'node:path';

const FROM = 'q.describeFirst = q.onlyDescribe || (parameters.length && !q.prepared)';
const TO = 'q.describeFirst = q.onlyDescribe || (parameters.length && !q.prepared && q.prepare)';
let patched = 0;
for (const v of ['src', 'cjs/src', 'cf/src']) {
  const f = path.join('node_modules', 'postgres', v, 'connection.js');
  if (!fs.existsSync(f)) continue;
  const s = fs.readFileSync(f, 'utf8');
  if (s.includes(TO)) { patched++; continue; }
  if (!s.includes(FROM)) { console.warn(`[patch-postgres] motif introuvable dans ${f}`); continue; }
  fs.writeFileSync(f, s.replace(FROM, TO));
  patched++;
}
console.log(`[patch-postgres] ${patched} fichier(s) prêt(s)`);
