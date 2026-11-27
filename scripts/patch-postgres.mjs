// Correctif postgres.js pour les poolers en mode transaction (Supabase Supavisor, PgBouncer).
// Avec prepare:false, postgres.js envoie Parse + Describe + Flush puis attend la réponse avant
// Bind/Execute/Sync : certains poolers ne relaient pas cette réponse et la requête reste bloquée.
// On envoie alors tout en un seul message (Parse, Describe, Bind, Execute, Sync), comme node-postgres.
import fs from 'node:fs';
import path from 'node:path';

// 2) Avec max_pipeline = 1, aucune requête n'est envoyée tant que la précédente n'est pas terminée
//    (la version d'origine en laisse partir deux) : le pooler ne mélange plus les réponses.
const PATCHES = [
  ['q.describeFirst = q.onlyDescribe || (parameters.length && !q.prepared)', 'q.describeFirst = q.onlyDescribe || (parameters.length && !q.prepared && q.prepare)'],
  [
    '&& sent.length < max_pipeline\n        && (!q.options.onexecute || q.options.onexecute(connection))',
    '&& (!q.options.onexecute || q.options.onexecute(connection))\n        && sent.length + 1 < max_pipeline',
  ],
];
let patched = 0;
for (const v of ['src', 'cjs/src', 'cf/src']) {
  const f = path.join('node_modules', 'postgres', v, 'connection.js');
  if (!fs.existsSync(f)) continue;
  let s = fs.readFileSync(f, 'utf8');
  for (const [from, to] of PATCHES) {
    if (s.includes(to)) continue;
    if (!s.includes(from)) { console.warn(`[patch-postgres] motif introuvable dans ${f} : ${from}`); continue; }
    s = s.replace(from, to);
  }
  fs.writeFileSync(f, s);
  patched++;
}
console.log(`[patch-postgres] ${patched} fichier(s) prêt(s)`);
